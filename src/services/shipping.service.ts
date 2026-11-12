import { AppError } from "@/errors/AppError";
import { sellerRepository } from "@/repositories/seller.repository";
import type { CalculateRouteInput } from "@/schemas/shipping.schema";
import {
	type Coordinates,
	type GeoJsonLineString,
	type RoutingService,
	routingService,
} from "./routing.service";

// Cálculo único de frete por vendedor (VER-91). Carrinho, checkout e o endpoint
// POST /frete/calcular-rota usam estas funções, para os valores nunca divergirem.
//
// Regra: frete = taxa base + (distância de condução em km × preço por km), 2 casas.
// Vendedor sem origem configurada usa a taxa fixa antiga (users.fixed_shipping_rate).

type Decimal = number | string | null | undefined;

export interface SellerShippingSource {
	id: string;
	farm_name?: string | null;
	latitude?: Decimal;
	longitude?: Decimal;
	shipping_base_fee?: Decimal;
	shipping_price_per_km?: Decimal;
	max_delivery_radius_km?: Decimal;
	user?: { fixed_shipping_rate?: Decimal } | null;
}

export interface CustomerAddressSource {
	zip_code?: string | null;
	street?: string | null;
	number?: string | null;
	neighborhood_name?: string | null;
	city?: string | null;
	state?: string | null;
	address?: string | null;
}

export type ShippingPricingMode = "POR_KM" | "TAXA_FIXA";

export interface SellerShippingQuote {
	seller_id: string;
	farm_name: string | null;
	pricing_mode: ShippingPricingMode;
	shipping_cost: number;
	distance_km: number | null;
	duration_min: number | null;
	within_radius: boolean;
	max_delivery_radius_km: number | null;
	origin: Coordinates | null;
	route: GeoJsonLineString | null;
}

export interface SimulatedRouteResponse {
	seller_id: string;
	pricing_mode: ShippingPricingMode;
	distance_km: number | null;
	duration_min: number | null;
	shipping_cost: number;
	within_radius: boolean;
	max_delivery_radius_km: number | null;
	origin: Coordinates | null;
	destination: Coordinates | null;
	route: {
		type: "Feature";
		properties: Record<string, never>;
		geometry: GeoJsonLineString;
	} | null;
}

export interface ShippingTotals {
	shipping_amount: number;
	shipping_distance_km: number | null;
}

function toNumberOrNull(value: Decimal): number | null {
	if (value === null || value === undefined || value === "") return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

// Arredonda a 2 casas pela notação exponencial, evitando o erro de ponto flutuante
// de value * 100 (ex.: 1.005 * 100 = 100.49999...)
export function roundMoney(value: number): number {
	return Number(`${Math.round(Number(`${value}e2`))}e-2`);
}

/**
 * Fórmula do frete por quilômetro, arredondada a 2 casas.
 * Ex.: base R$ 5,00 e R$ 2,00/km → 5 km = R$ 15,00; 30 km = R$ 65,00.
 */
export function calculateDistanceShippingCost(
	baseFee: number,
	pricePerKm: number,
	distanceKm: number,
): number {
	return roundMoney(baseFee + distanceKm * pricePerKm);
}

export function getSellerOrigin(
	seller: SellerShippingSource,
): Coordinates | null {
	const latitude = toNumberOrNull(seller.latitude);
	const longitude = toNumberOrNull(seller.longitude);
	if (latitude === null || longitude === null) return null;
	return { latitude, longitude };
}

export function usesDistancePricing(seller: SellerShippingSource): boolean {
	return getSellerOrigin(seller) !== null;
}

export function hasCompleteStructuredAddress(
	customer: CustomerAddressSource | null | undefined,
): boolean {
	return (
		Boolean(customer?.zip_code) &&
		Boolean(customer?.street) &&
		Boolean(customer?.number) &&
		Boolean(customer?.city) &&
		Boolean(customer?.state)
	);
}

export function outOfRadiusMessage(quote: SellerShippingQuote): string {
	const sellerName = quote.farm_name ? `"${quote.farm_name}"` : "O produtor";
	return (
		`${sellerName} entrega até ${quote.max_delivery_radius_km} km e o seu endereço ` +
		`fica a ${quote.distance_km} km. Escolha a Retirada para este pedido.`
	);
}

export class ShippingService {
	constructor(private readonly routing: RoutingService = routingService) {}

	/**
	 * Coordenadas do endereço do cliente: estruturado (VER-63) ou, para cadastros
	 * antigos, o texto livre. Sem endereço, devolve null.
	 */
	async resolveCustomerDestination(
		customer: CustomerAddressSource | null | undefined,
	): Promise<Coordinates | null> {
		if (customer && hasCompleteStructuredAddress(customer)) {
			return this.routing.geocodeStructuredAddress({
				zip_code: customer.zip_code,
				street: customer.street,
				number: customer.number,
				neighborhood: customer.neighborhood_name,
				city: customer.city,
				state: customer.state,
			});
		}

		const legacyAddress = customer?.address?.trim();
		if (legacyAddress) {
			return this.routing.geocodeText(legacyAddress);
		}

		return null;
	}

	/**
	 * Frete de um vendedor até o destino. Não lança erro para destino fora do raio:
	 * quem chama decide (422 no endpoint, 400 no checkout, aviso no carrinho).
	 */
	async quoteSeller(
		seller: SellerShippingSource,
		destination: Coordinates | null,
	): Promise<SellerShippingQuote> {
		const origin = getSellerOrigin(seller);
		const radius = toNumberOrNull(seller.max_delivery_radius_km);

		if (!origin) {
			return {
				seller_id: seller.id,
				farm_name: seller.farm_name ?? null,
				pricing_mode: "TAXA_FIXA",
				shipping_cost: roundMoney(
					toNumberOrNull(seller.user?.fixed_shipping_rate) ?? 0,
				),
				distance_km: null,
				duration_min: null,
				within_radius: true,
				max_delivery_radius_km: null,
				origin: null,
				route: null,
			};
		}

		if (!destination) {
			throw new AppError(
				"Para calcular o frete por distância, preencha o endereço completo (CEP, logradouro, número, cidade e UF) no perfil.",
				400,
			);
		}

		const route = await this.routing.getDrivingRoute(origin, destination);

		return {
			seller_id: seller.id,
			farm_name: seller.farm_name ?? null,
			pricing_mode: "POR_KM",
			shipping_cost: calculateDistanceShippingCost(
				toNumberOrNull(seller.shipping_base_fee) ?? 0,
				toNumberOrNull(seller.shipping_price_per_km) ?? 0,
				route.distance_km,
			),
			distance_km: route.distance_km,
			duration_min: route.duration_min,
			within_radius: radius === null || route.distance_km <= radius,
			max_delivery_radius_km: radius,
			origin,
			route: route.geometry,
		};
	}

	/**
	 * Frete de todos os vendedores distintos de um carrinho. O endereço do cliente só
	 * é geocodificado se algum vendedor cobrar por distância.
	 */
	async quoteSellers(
		sellers: SellerShippingSource[],
		customer: CustomerAddressSource | null | undefined,
	): Promise<SellerShippingQuote[]> {
		const distinct = new Map<string, SellerShippingSource>();
		for (const seller of sellers) {
			if (!distinct.has(seller.id)) distinct.set(seller.id, seller);
		}

		const needsDestination = [...distinct.values()].some(usesDistancePricing);
		const destination = needsDestination
			? await this.resolveCustomerDestination(customer)
			: null;

		const quotes: SellerShippingQuote[] = [];
		for (const seller of distinct.values()) {
			quotes.push(await this.quoteSeller(seller, destination));
		}
		return quotes;
	}

	/**
	 * POST /frete/calcular-rota: simulação para a PDP. Destino fora do raio → 422.
	 * Vendedor sem origem configurada → 200 com a taxa fixa (pricing_mode TAXA_FIXA).
	 */
	async simulateRoute(
		input: CalculateRouteInput,
	): Promise<SimulatedRouteResponse> {
		const seller = await sellerRepository.findOne({
			where: { id: input.seller_id },
			relations: { user: true },
		});
		if (!seller) {
			throw new AppError("Vendedor não encontrado.", 404);
		}

		let destination: Coordinates | null =
			input.latitude !== undefined && input.longitude !== undefined
				? { latitude: input.latitude, longitude: input.longitude }
				: null;

		// Só geocodifica o CEP se o vendedor cobrar por distância
		if (!destination && input.cep && usesDistancePricing(seller)) {
			destination = await this.routing.geocodePostalCode(input.cep);
		}

		const quote = await this.quoteSeller(seller, destination);

		if (!quote.within_radius) {
			throw new AppError(outOfRadiusMessage(quote), 422);
		}

		return {
			seller_id: quote.seller_id,
			pricing_mode: quote.pricing_mode,
			distance_km: quote.distance_km,
			duration_min: quote.duration_min,
			shipping_cost: quote.shipping_cost,
			within_radius: quote.within_radius,
			max_delivery_radius_km: quote.max_delivery_radius_km,
			origin: quote.origin,
			destination,
			route: quote.route
				? { type: "Feature", properties: {}, geometry: quote.route }
				: null,
		};
	}

	sumQuotes(quotes: SellerShippingQuote[]): ShippingTotals {
		const amount = quotes.reduce((acc, quote) => acc + quote.shipping_cost, 0);
		const distances = quotes
			.map((quote) => quote.distance_km)
			.filter((distance): distance is number => distance !== null);

		return {
			shipping_amount: roundMoney(amount),
			shipping_distance_km:
				distances.length > 0
					? roundMoney(distances.reduce((acc, value) => acc + value, 0))
					: null,
		};
	}
}

export const shippingService = new ShippingService();
