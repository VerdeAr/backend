import process from "node:process";
import { AppError } from "@/errors/AppError";

// Integração com o OpenRouteService (VER-91): rota de carro e geocodificação.
// A chave fica só em ORS_API_KEY e vai no cabeçalho Authorization, nunca na URL nem em log.

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export interface GeoJsonLineString {
	type: "LineString";
	// Pares [longitude, latitude], como no padrão GeoJSON
	coordinates: [number, number][];
}

export interface DrivingRoute {
	distance_km: number;
	duration_min: number;
	geometry: GeoJsonLineString;
}

export interface StructuredAddressQuery {
	zip_code?: string | null;
	street?: string | null;
	number?: string | null;
	neighborhood?: string | null;
	city?: string | null;
	state?: string | null;
}

const DEFAULT_BASE_URL = "https://api.openrouteservice.org";
const DEFAULT_TIMEOUT_MS = 8_000;
const ROUTE_CACHE_TTL_MS = 15 * 60 * 1000;
const GEOCODE_CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1_000;

// Códigos de erro do ORS para "não existe rota de carro entre os pontos"
const ORS_UNROUTABLE_CODES = new Set([2004, 2009, 2010]);

// Resultados de geocodificação amplos demais para calcular frete (estado, país...)
const COARSE_GEOCODE_LAYERS = new Set([
	"region",
	"macroregion",
	"country",
	"dependency",
	"macrocounty",
	"empire",
	"continent",
	"ocean",
	"marinearea",
]);

const UNAVAILABLE_MESSAGE =
	"O cálculo de frete está indisponível no momento. Tente novamente em instantes ou escolha a Retirada.";
const UNROUTABLE_MESSAGE =
	"Não foi possível traçar uma rota de carro até o endereço informado. Escolha a Retirada.";
const ADDRESS_NOT_FOUND_MESSAGE =
	"Não foi possível localizar o endereço informado. Confira o CEP e o endereço do perfil ou escolha a Retirada.";

class TtlCache<T> {
	private readonly entries = new Map<string, { value: T; expiresAt: number }>();

	constructor(
		private readonly ttlMs: number,
		private readonly maxEntries: number,
	) {}

	get(key: string): T | undefined {
		const entry = this.entries.get(key);
		if (!entry) return undefined;

		if (entry.expiresAt <= Date.now()) {
			this.entries.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: string, value: T): void {
		// Map mantém a ordem de inserção: ao lotar, descarta a entrada mais antiga
		if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
			const oldestKey = this.entries.keys().next().value;
			if (oldestKey !== undefined) this.entries.delete(oldestKey);
		}
		this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
	}

	clear(): void {
		this.entries.clear();
	}
}

export function assertValidCoordinates(point: Coordinates): void {
	const { latitude, longitude } = point;
	if (
		!Number.isFinite(latitude) ||
		!Number.isFinite(longitude) ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		throw new AppError("Coordenadas inválidas.", 400, [
			{
				field: "coordinates",
				message:
					"Latitude deve estar entre -90 e 90 e longitude entre -180 e 180.",
			},
		]);
	}
}

function coordinatesKey(point: Coordinates): string {
	return `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
}

// Registra a falha sem chave, URL com parâmetros ou endereço/coordenadas (dados pessoais)
function logOrsFailure(operation: string, detail: string): void {
	console.error(`[OpenRouteService] Falha em ${operation}: ${detail}`);
}

interface OrsErrorBody {
	error?: { code?: number; message?: string } | string;
}

function extractOrsErrorCode(body: unknown): number | undefined {
	const error = (body as OrsErrorBody | null)?.error;
	if (error && typeof error === "object" && typeof error.code === "number") {
		return error.code;
	}
	return undefined;
}

export class RoutingService {
	private readonly routeCache = new TtlCache<DrivingRoute>(
		ROUTE_CACHE_TTL_MS,
		CACHE_MAX_ENTRIES,
	);
	private readonly geocodeCache = new TtlCache<Coordinates>(
		GEOCODE_CACHE_TTL_MS,
		CACHE_MAX_ENTRIES,
	);

	/**
	 * Rota de carro entre dois pontos: distância (km), duração (min) e geometria GeoJSON.
	 */
	async getDrivingRoute(
		origin: Coordinates,
		destination: Coordinates,
	): Promise<DrivingRoute> {
		assertValidCoordinates(origin);
		assertValidCoordinates(destination);

		const cacheKey = `${coordinatesKey(origin)}|${coordinatesKey(destination)}`;
		const cached = this.routeCache.get(cacheKey);
		if (cached) return cached;

		const body = await this.request(
			"rota",
			"/v2/directions/driving-car/geojson",
			{
				method: "POST",
				body: JSON.stringify({
					coordinates: [
						[origin.longitude, origin.latitude],
						[destination.longitude, destination.latitude],
					],
				}),
			},
		);

		const feature = (
			body as {
				features?: {
					geometry?: GeoJsonLineString;
					properties?: { summary?: { distance?: number; duration?: number } };
				}[];
			}
		)?.features?.[0];
		const summary = feature?.properties?.summary;
		const geometry = feature?.geometry;

		if (geometry?.type !== "LineString") {
			logOrsFailure("rota", "resposta sem geometria LineString");
			throw new AppError(UNROUTABLE_MESSAGE, 422);
		}

		// Origem e destino no mesmo ponto: o ORS omite distance/duration
		const route: DrivingRoute = {
			distance_km: Number(((summary?.distance ?? 0) / 1000).toFixed(2)),
			duration_min: Math.round((summary?.duration ?? 0) / 60),
			geometry: {
				type: "LineString",
				coordinates: geometry.coordinates,
			},
		};

		this.routeCache.set(cacheKey, route);
		return route;
	}

	/**
	 * Converte o endereço estruturado do perfil em coordenadas.
	 */
	async geocodeStructuredAddress(
		address: StructuredAddressQuery,
	): Promise<Coordinates> {
		const params = new URLSearchParams({ country: "BR", size: "1" });
		const streetLine = [address.street, address.number]
			.filter(Boolean)
			.join(" ");

		if (streetLine) params.set("address", streetLine);
		if (address.neighborhood) params.set("neighbourhood", address.neighborhood);
		if (address.city) params.set("locality", address.city);
		if (address.state) params.set("region", address.state);
		if (address.zip_code) params.set("postalcode", address.zip_code);

		return this.geocode("/geocode/search/structured", params);
	}

	/**
	 * Converte um CEP (8 dígitos) em coordenadas, usado na simulação da PDP.
	 */
	async geocodePostalCode(zipCode: string): Promise<Coordinates> {
		const params = new URLSearchParams({
			country: "BR",
			size: "1",
			postalcode: zipCode,
		});
		return this.geocode("/geocode/search/structured", params);
	}

	/**
	 * Converte o endereço em texto livre (cadastro antigo) em coordenadas.
	 */
	async geocodeText(text: string): Promise<Coordinates> {
		const params = new URLSearchParams({
			text,
			"boundary.country": "BR",
			size: "1",
		});
		return this.geocode("/geocode/search", params);
	}

	clearCache(): void {
		this.routeCache.clear();
		this.geocodeCache.clear();
	}

	private async geocode(
		path: string,
		params: URLSearchParams,
	): Promise<Coordinates> {
		const cacheKey = `${path}?${params.toString().toLowerCase()}`;
		const cached = this.geocodeCache.get(cacheKey);
		if (cached) return cached;

		const body = await this.request(
			"geocodificação",
			`${path}?${params.toString()}`,
			{ method: "GET" },
		);

		const feature = (
			body as {
				features?: {
					geometry?: { coordinates?: [number, number] };
					properties?: { layer?: string };
				}[];
			}
		)?.features?.[0];
		const position = feature?.geometry?.coordinates;
		const layer = feature?.properties?.layer;

		if (!position || (layer && COARSE_GEOCODE_LAYERS.has(layer))) {
			throw new AppError(ADDRESS_NOT_FOUND_MESSAGE, 422);
		}

		const coordinates: Coordinates = {
			longitude: Number(position[0]),
			latitude: Number(position[1]),
		};
		assertValidCoordinates(coordinates);

		this.geocodeCache.set(cacheKey, coordinates);
		return coordinates;
	}

	private async request(
		operation: string,
		path: string,
		init: { method: "GET" | "POST"; body?: string },
	): Promise<unknown> {
		const apiKey = process.env.ORS_API_KEY;
		if (!apiKey) {
			logOrsFailure(operation, "ORS_API_KEY não configurada");
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}

		const baseUrl = process.env.ORS_BASE_URL || DEFAULT_BASE_URL;
		const timeoutMs = Number(process.env.ORS_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

		let response: Response;
		try {
			response = await fetch(`${baseUrl}${path}`, {
				method: init.method,
				body: init.body,
				headers: {
					Authorization: apiKey,
					Accept: "application/json, application/geo+json",
					...(init.body ? { "Content-Type": "application/json" } : {}),
				},
				signal: AbortSignal.timeout(timeoutMs),
			});
		} catch (error) {
			const reason =
				error instanceof Error && error.name === "TimeoutError"
					? `tempo limite de ${timeoutMs} ms excedido`
					: "serviço inacessível";
			logOrsFailure(operation, reason);
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}

		let body: unknown = null;
		try {
			body = await response.json();
		} catch {
			body = null;
		}

		if (response.ok) return body;

		const orsCode = extractOrsErrorCode(body);

		if (response.status === 401 || response.status === 403) {
			logOrsFailure(
				operation,
				`chave inválida ou sem permissão (HTTP ${response.status})`,
			);
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}

		if (response.status === 429) {
			logOrsFailure(operation, "cota de requisições excedida (HTTP 429)");
			throw new AppError(UNAVAILABLE_MESSAGE, 503);
		}

		if (orsCode !== undefined && ORS_UNROUTABLE_CODES.has(orsCode)) {
			throw new AppError(UNROUTABLE_MESSAGE, 422);
		}

		logOrsFailure(
			operation,
			`HTTP ${response.status}${orsCode !== undefined ? ` (código ${orsCode})` : ""}`,
		);
		throw new AppError(UNAVAILABLE_MESSAGE, 503);
	}
}

export const routingService = new RoutingService();
