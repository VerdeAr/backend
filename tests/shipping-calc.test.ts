import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/errors/AppError";
import { RoutingService } from "@/services/routing.service";
import {
	calculateDistanceShippingCost,
	roundMoney,
	type SellerShippingSource,
	ShippingService,
} from "@/services/shipping.service";

const DESTINATION = { latitude: -23.18, longitude: -50.65 };

function fakeRoute(distanceKm: number) {
	return {
		distance_km: distanceKm,
		duration_min: Math.round(distanceKm * 1.2),
		geometry: {
			type: "LineString" as const,
			coordinates: [
				[-50.6, -23.1],
				[-50.65, -23.18],
			] as [number, number][],
		},
	};
}

function createService(distanceKm = 5) {
	const routing = new RoutingService();
	const routeSpy = vi
		.spyOn(routing, "getDrivingRoute")
		.mockResolvedValue(fakeRoute(distanceKm));
	const geocodeSpy = vi
		.spyOn(routing, "geocodeStructuredAddress")
		.mockResolvedValue(DESTINATION);
	const geocodeTextSpy = vi
		.spyOn(routing, "geocodeText")
		.mockResolvedValue(DESTINATION);

	return {
		service: new ShippingService(routing),
		routeSpy,
		geocodeSpy,
		geocodeTextSpy,
	};
}

const perKmSeller: SellerShippingSource = {
	id: "seller-km",
	farm_name: "Sítio Teste",
	latitude: "-23.1000000",
	longitude: "-50.6000000",
	shipping_base_fee: "5.00",
	shipping_price_per_km: "2.00",
	max_delivery_radius_km: "20.00",
	user: { fixed_shipping_rate: "99.00" },
};

const fixedRateSeller: SellerShippingSource = {
	id: "seller-fixo",
	farm_name: "Chácara Antiga",
	latitude: null,
	longitude: null,
	shipping_base_fee: "0.00",
	shipping_price_per_km: "0.00",
	max_delivery_radius_km: null,
	user: { fixed_shipping_rate: "12.50" },
};

const fullAddress = {
	zip_code: "86300000",
	street: "Rua dos Testes",
	number: "100",
	city: "Cornélio Procópio",
	state: "PR",
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("fórmula do frete por quilômetro (VER-91)", () => {
	it("bate com os exemplos do critério de aceite", () => {
		expect(calculateDistanceShippingCost(5, 2, 5)).toBe(15);
		expect(calculateDistanceShippingCost(5, 2, 30)).toBe(65);
	});

	it("arredonda a 2 casas decimais", () => {
		expect(calculateDistanceShippingCost(0, 1.15, 3.333)).toBe(3.83);
		expect(calculateDistanceShippingCost(4.99, 1.37, 12.47)).toBe(22.07);
		expect(roundMoney(1.005)).toBe(1.01);
	});

	it("distância zero cobra só a taxa base", () => {
		expect(calculateDistanceShippingCost(7.5, 3, 0)).toBe(7.5);
	});
});

describe("ShippingService.quoteSeller", () => {
	it("vendedor com origem cobra por km e informa distância e rota", async () => {
		const { service } = createService(5);

		const quote = await service.quoteSeller(perKmSeller, DESTINATION);

		expect(quote.pricing_mode).toBe("POR_KM");
		expect(quote.shipping_cost).toBe(15);
		expect(quote.distance_km).toBe(5);
		expect(quote.within_radius).toBe(true);
		expect(quote.max_delivery_radius_km).toBe(20);
		expect(quote.origin).toEqual({ latitude: -23.1, longitude: -50.6 });
		expect(quote.route?.type).toBe("LineString");
	});

	it("destino além do raio fica marcado como fora do raio", async () => {
		const { service } = createService(30);

		const quote = await service.quoteSeller(perKmSeller, DESTINATION);

		expect(quote.within_radius).toBe(false);
		expect(quote.shipping_cost).toBe(65);
	});

	it("destino exatamente no limite do raio ainda é atendido", async () => {
		const { service } = createService(20);

		const quote = await service.quoteSeller(perKmSeller, DESTINATION);

		expect(quote.within_radius).toBe(true);
	});

	it("raio vazio significa sem limite", async () => {
		const { service } = createService(500);

		const quote = await service.quoteSeller(
			{ ...perKmSeller, max_delivery_radius_km: null },
			DESTINATION,
		);

		expect(quote.within_radius).toBe(true);
		expect(quote.max_delivery_radius_km).toBeNull();
	});

	it("vendedor sem origem usa a taxa fixa antiga, sem chamar o serviço de rotas", async () => {
		const { service, routeSpy } = createService();

		const quote = await service.quoteSeller(fixedRateSeller, null);

		expect(quote.pricing_mode).toBe("TAXA_FIXA");
		expect(quote.shipping_cost).toBe(12.5);
		expect(quote.distance_km).toBeNull();
		expect(routeSpy).not.toHaveBeenCalled();
	});

	it("frete por km sem destino pede o endereço completo (400)", async () => {
		const { service } = createService();

		await expect(service.quoteSeller(perKmSeller, null)).rejects.toMatchObject({
			statusCode: 400,
		});
		await expect(service.quoteSeller(perKmSeller, null)).rejects.toBeInstanceOf(
			AppError,
		);
	});
});

describe("ShippingService.quoteSellers e sumQuotes", () => {
	it("soma o frete de cada vendedor distinto e a distância dos que cobram por km", async () => {
		const { service } = createService(5);

		const quotes = await service.quoteSellers(
			[perKmSeller, fixedRateSeller, perKmSeller],
			fullAddress,
		);
		const totals = service.sumQuotes(quotes);

		expect(quotes).toHaveLength(2);
		expect(totals.shipping_amount).toBe(27.5);
		expect(totals.shipping_distance_km).toBe(5);
	});

	it("só geocodifica o endereço quando algum vendedor cobra por km", async () => {
		const { service, geocodeSpy } = createService();

		const quotes = await service.quoteSellers([fixedRateSeller], null);

		expect(quotes[0].shipping_cost).toBe(12.5);
		expect(service.sumQuotes(quotes).shipping_distance_km).toBeNull();
		expect(geocodeSpy).not.toHaveBeenCalled();
	});

	it("cliente antigo com só o endereço em texto livre é geocodificado pelo texto", async () => {
		const { service, geocodeSpy, geocodeTextSpy } = createService(5);

		await service.quoteSellers([perKmSeller], {
			address: "Rua Antiga, 50 - Centro",
		});

		expect(geocodeSpy).not.toHaveBeenCalled();
		expect(geocodeTextSpy).toHaveBeenCalledWith("Rua Antiga, 50 - Centro");
	});
});
