import process from "node:process";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { routingService } from "@/services/routing.service";
import { createClient } from "./helpers/client";
import {
	createProduct,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

// O OpenRouteService é simulado: a distância de condução é controlada pelo teste
const ors = {
	distanceMeters: 5_000,
	down: false,
	calls: 0,
};

const SELLER_ORIGIN = { latitude: -23.1, longitude: -50.6 };
const CUSTOMER_POINT = { latitude: -23.18, longitude: -50.65 };

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

async function fakeOrsFetch(input: string | URL | Request): Promise<Response> {
	ors.calls += 1;
	if (ors.down) throw new TypeError("fetch failed");

	const url = String(input);
	if (url.includes("/v2/directions/driving-car/geojson")) {
		return jsonResponse(200, {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					properties: {
						summary: { distance: ors.distanceMeters, duration: 600 },
					},
					geometry: {
						type: "LineString",
						coordinates: [
							[SELLER_ORIGIN.longitude, SELLER_ORIGIN.latitude],
							[CUSTOMER_POINT.longitude, CUSTOMER_POINT.latitude],
						],
					},
				},
			],
		});
	}

	if (url.includes("/geocode/")) {
		return jsonResponse(200, {
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: {
						type: "Point",
						coordinates: [CUSTOMER_POINT.longitude, CUSTOMER_POINT.latitude],
					},
					properties: { layer: "address" },
				},
			],
		});
	}

	return jsonResponse(404, {});
}

async function getSellerId(productId: string): Promise<string> {
	const response = await createClient().get(`/produtos/${productId}`);
	return response.body.seller.id;
}

async function getStock(productId: string): Promise<number> {
	const response = await createClient().get(`/produtos/${productId}`);
	return Number(response.body.stock);
}

const previousEnv = { ...process.env };

beforeAll(() => {
	process.env.ORS_API_KEY = "chave-de-teste";
	process.env.ORS_BASE_URL = "https://ors.teste";
	vi.stubGlobal("fetch", vi.fn(fakeOrsFetch));
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	process.env = previousEnv;
});

beforeEach(() => {
	ors.distanceMeters = 5_000;
	ors.down = false;
	ors.calls = 0;
	routingService.clearCache();
});

describe("configuração do frete por km do vendedor (PUT /pessoa/frete)", () => {
	let seller: RegisteredUser;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
	});

	it("salva origem, taxa base, preço por km e raio, sem apagar a taxa fixa", async () => {
		await seller.client.put("/pessoa/frete").send({ fixed_shipping_rate: 9 });

		const response = await seller.client.put("/pessoa/frete").send({
			shipping_base_fee: 5,
			shipping_price_per_km: 2,
			max_delivery_radius_km: 20,
			...SELLER_ORIGIN,
		});

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			fixed_shipping_rate: 9,
			shipping_base_fee: 5,
			shipping_price_per_km: 2,
			max_delivery_radius_km: 20,
			latitude: SELLER_ORIGIN.latitude,
			longitude: SELLER_ORIGIN.longitude,
			pricing_mode: "POR_KM",
		});
	});

	it("recusa valores negativos, coordenadas inválidas e origem pela metade (400)", async () => {
		const negative = await seller.client
			.put("/pessoa/frete")
			.send({ shipping_price_per_km: -1 });
		const outOfRange = await seller.client
			.put("/pessoa/frete")
			.send({ latitude: 95, longitude: 10 });
		const halfOrigin = await seller.client
			.put("/pessoa/frete")
			.send({ latitude: -23.1 });

		for (const response of [negative, outOfRange, halfOrigin]) {
			expect(response.status).toBe(400);
			expect(response.body.errors.length).toBeGreaterThan(0);
		}
	});

	it("cliente não configura frete (403)", async () => {
		const customer = await registerUser("CLIENTE");

		const response = await customer.client
			.put("/pessoa/frete")
			.send({ shipping_base_fee: 5 });

		expect(response.status).toBe(403);
	});
});

describe("POST /frete/calcular-rota", () => {
	let perKmSellerId: string;
	let fixedSellerId: string;

	beforeAll(async () => {
		const perKmSeller = await registerUser("VENDEDOR");
		await perKmSeller.client.put("/pessoa/frete").send({
			shipping_base_fee: 5,
			shipping_price_per_km: 2,
			max_delivery_radius_km: 20,
			...SELLER_ORIGIN,
		});
		const perKmProduct = await createProduct(perKmSeller.client);
		perKmSellerId = await getSellerId(perKmProduct.id);

		const fixedSeller = await registerUser("VENDEDOR");
		await fixedSeller.client
			.put("/pessoa/frete")
			.send({ fixed_shipping_rate: 12.5 });
		const fixedProduct = await createProduct(fixedSeller.client);
		fixedSellerId = await getSellerId(fixedProduct.id);
	});

	it("com coordenadas, devolve distância, tempo, custo pela fórmula e a rota GeoJSON", async () => {
		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: perKmSellerId, ...CUSTOMER_POINT });

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			pricing_mode: "POR_KM",
			distance_km: 5,
			duration_min: 10,
			shipping_cost: 15,
			within_radius: true,
			origin: SELLER_ORIGIN,
			destination: CUSTOMER_POINT,
		});
		expect(response.body.route.type).toBe("Feature");
		expect(response.body.route.geometry.type).toBe("LineString");
	});

	it("aceita o destino por CEP (com ou sem traço)", async () => {
		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: perKmSellerId, cep: "86300-000" });

		expect(response.status).toBe(200);
		expect(response.body.destination).toEqual(CUSTOMER_POINT);
		expect(response.body.shipping_cost).toBe(15);
	});

	it("destino além do raio responde 422 sugerindo Retirada", async () => {
		ors.distanceMeters = 30_000;

		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: perKmSellerId, ...CUSTOMER_POINT });

		expect(response.status).toBe(422);
		expect(response.body.message).toContain("Retirada");
	});

	it("vendedor sem origem configurada usa a taxa fixa, sem chamar o ORS", async () => {
		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: fixedSellerId, cep: "86300000" });

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			pricing_mode: "TAXA_FIXA",
			shipping_cost: 12.5,
			distance_km: null,
			route: null,
		});
		expect(ors.calls).toBe(0);
	});

	it("dados inválidos respondem 400 com a lista de campos", async () => {
		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: "abc", latitude: 200 });

		expect(response.status).toBe(400);
		const fields = response.body.errors.map(
			(error: { field: string }) => error.field,
		);
		expect(fields).toContain("seller_id");
		expect(fields).toContain("latitude");
	});

	it("vendedor inexistente responde 404", async () => {
		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({
				seller_id: "8f14e45f-ceea-4f6a-9b1e-2d5c7a1b3c4d",
				...CUSTOMER_POINT,
			});

		expect(response.status).toBe(404);
	});

	it("ORS fora do ar responde 503 com mensagem amigável, sem derrubar a API", async () => {
		ors.down = true;

		const response = await createClient()
			.post("/frete/calcular-rota")
			.send({ seller_id: perKmSellerId, ...CUSTOMER_POINT });
		const health = await createClient().get("/health");

		expect(response.status).toBe(503);
		expect(response.body.message).toContain("indisponível");
		expect(response.body.message).not.toContain("fetch failed");
		expect(health.status).toBe(200);
	});
});

describe("frete por km no carrinho e no checkout", () => {
	let seller: RegisteredUser;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		await seller.client.put("/pessoa/frete").send({
			shipping_base_fee: 5,
			shipping_price_per_km: 2,
			max_delivery_radius_km: 20,
			...SELLER_ORIGIN,
		});
	});

	async function fillCart(customer: RegisteredUser, stock = 10) {
		const product = await createProduct(seller.client, { price: 10, stock });
		await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 2 });
		await customer.client
			.post("/carrinho/entrega")
			.send({ delivery_type: "ENTREGA" });
		return product;
	}

	it("carrinho, checkout e pedido gravado trazem o mesmo frete", async () => {
		const customer = await registerUser("CLIENTE");
		await fillCart(customer);

		const cart = await customer.client.get("/carrinho");
		const checkout = await customer.client
			.post("/vendas/checkout")
			.send({ payment_method: "PIX" });

		expect(cart.status).toBe(200);
		expect(cart.body.shipping).toBe(15);
		expect(cart.body.shipping_status).toBe("OK");
		expect(cart.body.shipping_details[0]).toMatchObject({
			pricing_mode: "POR_KM",
			distance_km: 5,
			shipping_cost: 15,
		});
		expect(cart.body.total).toBe(35);

		expect(checkout.status).toBe(201);
		expect(Number(checkout.body.shipping_amount)).toBe(15);
		expect(Number(checkout.body.shipping_distance_km)).toBe(5);
		expect(Number(checkout.body.total_amount)).toBe(35);
	});

	it("o frete do pedido não muda se o vendedor alterar o preço depois", async () => {
		const customer = await registerUser("CLIENTE");
		await fillCart(customer);
		const checkout = await customer.client.post("/vendas/checkout").send({});

		await seller.client.put("/pessoa/frete").send({ shipping_price_per_km: 9 });
		const purchases = await customer.client.get("/vendas/minhas-compras");
		await seller.client.put("/pessoa/frete").send({ shipping_price_per_km: 2 });

		const purchase = purchases.body.find(
			(item: { id: string }) => item.id === checkout.body.id,
		);
		expect(purchase.shipping_amount).toBe(15);
		expect(purchase.shipping_distance_km).toBe(5);
		expect(purchase.total_amount).toBe(35);
	});

	it("fora do raio: carrinho avisa e o checkout recusa com 400 sem criar pedido", async () => {
		ors.distanceMeters = 30_000;
		const customer = await registerUser("CLIENTE");
		const product = await fillCart(customer, 10);

		const cart = await customer.client.get("/carrinho");
		const checkout = await customer.client.post("/vendas/checkout").send({});
		const purchases = await customer.client.get("/vendas/minhas-compras");

		expect(cart.body.shipping_status).toBe("FORA_DO_RAIO");
		expect(cart.body.shipping_message).toContain("Retirada");
		expect(checkout.status).toBe(400);
		expect(checkout.body.message).toContain("Retirada");
		expect(purchases.body).toHaveLength(0);
		expect(await getStock(product.id)).toBe(10);
	});

	it("fora do raio, a Retirada continua funcionando", async () => {
		ors.distanceMeters = 30_000;
		const customer = await registerUser("CLIENTE");
		await fillCart(customer);

		const checkout = await customer.client
			.post("/vendas/checkout")
			.send({ delivery_type: "RETIRADA" });

		expect(checkout.status).toBe(201);
		expect(Number(checkout.body.shipping_amount)).toBe(0);
		expect(checkout.body.shipping_distance_km).toBeNull();
	});

	it("ORS fora do ar: o carrinho abre com aviso e o checkout responde 503", async () => {
		const customer = await registerUser("CLIENTE");
		await fillCart(customer);
		// Rota calculada antes da queda já expirou do cache
		routingService.clearCache();
		ors.down = true;

		const cart = await customer.client.get("/carrinho");
		const checkout = await customer.client.post("/vendas/checkout").send({});

		expect(cart.status).toBe(200);
		expect(cart.body.shipping_status).toBe("INDISPONIVEL");
		expect(cart.body.shipping_message).toContain("indisponível");
		expect(checkout.status).toBe(503);
	});

	it("cliente sem endereço vê o aviso no carrinho e não fecha Entrega", async () => {
		const customer = await registerUser("CLIENTE", { address: "nenhum" });
		await fillCart(customer);

		const cart = await customer.client.get("/carrinho");
		const checkout = await customer.client.post("/vendas/checkout").send({});

		expect(cart.status).toBe(200);
		expect(cart.body.shipping_status).toBe("SEM_ENDERECO");
		expect(checkout.status).toBe(400);
		expect(checkout.body.message).toContain("endereço completo");
	});
});
