import process from "node:process";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { RoutingService } from "@/services/routing.service";

// O OpenRouteService é simulado: nenhum teste chama a API real
const API_KEY = "chave-secreta-de-teste";
const BASE_URL = "https://ors.teste";

const ORIGIN = { latitude: -23.1, longitude: -50.6 };
const DESTINATION = { latitude: -23.18, longitude: -50.65 };

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

const directionsBody = {
	type: "FeatureCollection",
	features: [
		{
			type: "Feature",
			properties: { summary: { distance: 12_345, duration: 900 } },
			geometry: {
				type: "LineString",
				coordinates: [
					[-50.6, -23.1],
					[-50.62, -23.14],
					[-50.65, -23.18],
				],
			},
		},
	],
};

const previousEnv = { ...process.env };
let fetchMock: ReturnType<typeof vi.fn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
	process.env.ORS_API_KEY = API_KEY;
	process.env.ORS_BASE_URL = BASE_URL;
});

afterAll(() => {
	process.env = previousEnv;
});

beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function loggedText(): string {
	return errorSpy.mock.calls.flat().map(String).join(" ");
}

describe("RoutingService.getDrivingRoute (VER-91)", () => {
	it("devolve distância em km, duração em minutos e a rota em GeoJSON", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, directionsBody));
		const service = new RoutingService();

		const route = await service.getDrivingRoute(ORIGIN, DESTINATION);

		expect(route.distance_km).toBe(12.35);
		expect(route.duration_min).toBe(15);
		expect(route.geometry.type).toBe("LineString");
		expect(route.geometry.coordinates).toHaveLength(3);
	});

	it("usa o perfil de carro e manda a chave no cabeçalho, nunca na URL", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, directionsBody));
		const service = new RoutingService();

		await service.getDrivingRoute(ORIGIN, DESTINATION);

		const [url, init] = fetchMock.mock.calls[0];
		expect(String(url)).toBe(`${BASE_URL}/v2/directions/driving-car/geojson`);
		expect(String(url)).not.toContain(API_KEY);
		expect(init.headers.Authorization).toBe(API_KEY);
		expect(JSON.parse(init.body)).toEqual({
			coordinates: [
				[-50.6, -23.1],
				[-50.65, -23.18],
			],
		});
	});

	it("reaproveita o cache para o mesmo par origem/destino", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, directionsBody));
		const service = new RoutingService();

		await service.getDrivingRoute(ORIGIN, DESTINATION);
		await service.getDrivingRoute(ORIGIN, DESTINATION);

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("recusa coordenadas fora da faixa válida sem chamar a API", async () => {
		const service = new RoutingService();

		await expect(
			service.getDrivingRoute({ latitude: 91, longitude: 0 }, DESTINATION),
		).rejects.toMatchObject({ statusCode: 400 });
		await expect(
			service.getDrivingRoute(ORIGIN, { latitude: 0, longitude: -181 }),
		).rejects.toMatchObject({ statusCode: 400 });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each([
		[401, "chave inválida"],
		[403, "chave inválida"],
		[429, "cota"],
		[500, "HTTP 500"],
		[502, "HTTP 502"],
	])(
		"HTTP %i do ORS vira 503 com mensagem amigável",
		async (status, logHint) => {
			fetchMock.mockResolvedValue(
				jsonResponse(status, {
					error: { code: 1, message: "detalhe interno" },
				}),
			);
			const service = new RoutingService();

			const error = await service
				.getDrivingRoute(ORIGIN, DESTINATION)
				.catch((err) => err);

			expect(error.statusCode).toBe(503);
			expect(error.message).toContain("indisponível");
			expect(error.message).not.toContain("detalhe interno");
			expect(loggedText()).toContain(logHint);
			expect(loggedText()).not.toContain(API_KEY);
		},
	);

	it("tempo limite ou falha de rede vira 503", async () => {
		const timeout = new Error("The operation was aborted due to timeout");
		timeout.name = "TimeoutError";
		fetchMock.mockRejectedValueOnce(timeout);
		fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
		const service = new RoutingService();

		await expect(
			service.getDrivingRoute(ORIGIN, DESTINATION),
		).rejects.toMatchObject({ statusCode: 503 });
		expect(loggedText()).toContain("tempo limite");

		await expect(
			service.getDrivingRoute(ORIGIN, DESTINATION),
		).rejects.toMatchObject({ statusCode: 503 });
		expect(loggedText()).toContain("inacessível");
	});

	it("passa um sinal de tempo limite para a chamada", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, directionsBody));
		const service = new RoutingService();

		await service.getDrivingRoute(ORIGIN, DESTINATION);

		expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
	});

	it.each([2004, 2009, 2010])(
		"rota impossível (código %i do ORS) vira 422",
		async (code) => {
			fetchMock.mockResolvedValue(
				jsonResponse(404, { error: { code, message: "Route not found" } }),
			);
			const service = new RoutingService();

			await expect(
				service.getDrivingRoute(ORIGIN, DESTINATION),
			).rejects.toMatchObject({ statusCode: 422 });
		},
	);

	it("sem ORS_API_KEY configurada responde 503 sem chamar a API", async () => {
		delete process.env.ORS_API_KEY;
		const service = new RoutingService();

		try {
			await expect(
				service.getDrivingRoute(ORIGIN, DESTINATION),
			).rejects.toMatchObject({ statusCode: 503 });
			expect(fetchMock).not.toHaveBeenCalled();
		} finally {
			process.env.ORS_API_KEY = API_KEY;
		}
	});
});

describe("RoutingService geocodificação", () => {
	const geocodeBody = (layer: string) => ({
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				geometry: { type: "Point", coordinates: [-50.65, -23.18] },
				properties: { layer },
			},
		],
	});

	it("converte o endereço estruturado em coordenadas, restrito ao Brasil", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, geocodeBody("address")));
		const service = new RoutingService();

		const point = await service.geocodeStructuredAddress({
			zip_code: "86300000",
			street: "Rua dos Testes",
			number: "100",
			city: "Cornélio Procópio",
			state: "PR",
		});

		expect(point).toEqual({ latitude: -23.18, longitude: -50.65 });
		const url = new URL(String(fetchMock.mock.calls[0][0]));
		expect(url.pathname).toBe("/geocode/search/structured");
		expect(url.searchParams.get("country")).toBe("BR");
		expect(url.searchParams.get("postalcode")).toBe("86300000");
		expect(url.searchParams.get("address")).toBe("Rua dos Testes 100");
		expect(url.searchParams.get("api_key")).toBeNull();
	});

	it("resultado amplo demais (estado ou país) não serve para frete: 422", async () => {
		fetchMock.mockResolvedValue(jsonResponse(200, geocodeBody("region")));
		const service = new RoutingService();

		await expect(service.geocodePostalCode("86300000")).rejects.toMatchObject({
			statusCode: 422,
		});
	});

	it("endereço não encontrado: 422", async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { type: "FeatureCollection", features: [] }),
		);
		const service = new RoutingService();

		await expect(service.geocodeText("lugar nenhum")).rejects.toMatchObject({
			statusCode: 422,
		});
	});

	it("não registra o endereço do cliente no log quando a API falha", async () => {
		fetchMock.mockResolvedValue(jsonResponse(500, {}));
		const service = new RoutingService();

		await service
			.geocodeText("Rua Sigilosa, 999 - Bairro Privado")
			.catch(() => undefined);

		expect(loggedText()).not.toContain("Sigilosa");
	});
});
