import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "./helpers/client";
import {
	createProduct,
	placeOrder,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

// VER-95: ajuste de itens ou pesagem com consentimento do cliente (RF-56)

const SHIPPING_RATE = 5;
const UNIT_PRICE = 10;

async function getStock(productId: string): Promise<number> {
	const response = await createClient().get(`/produtos/${productId}`);
	return Number(response.body.stock);
}

interface Scenario {
	seller: RegisteredUser;
	customer: RegisteredUser;
	productId: string;
	saleId: string;
	saleItemId: string;
}

// Vendedor com frete fixo, produto com estoque 10 e pedido de entrega já em preparação
async function createScenario(quantity: number): Promise<Scenario> {
	const seller = await registerUser("VENDEDOR");
	const customer = await registerUser("CLIENTE");
	await seller.client
		.put("/pessoa/frete")
		.send({ fixed_shipping_rate: SHIPPING_RATE });
	const product = await createProduct(seller.client, {
		price: UNIT_PRICE,
		stock: 10,
	});
	const saleId = await placeOrder(customer.client, [
		{ productId: product.id, quantity },
	]);
	await seller.client
		.patch(`/vendedor/pedidos/${saleId}/status`)
		.send({ status: "EM_PREPARACAO" });

	const detail = await seller.client.get(`/vendedor/pedidos/${saleId}`);

	return {
		seller,
		customer,
		productId: product.id,
		saleId,
		saleItemId: detail.body.items[0].id,
	};
}

function propose(
	user: RegisteredUser,
	saleId: string,
	body: { reason?: unknown; items?: unknown },
) {
	return user.client
		.post(`/vendedor/pedidos/${saleId}/propor-ajuste`)
		.send(body);
}

function respond(user: RegisteredUser, saleId: string, aceitar: unknown) {
	return user.client
		.post(`/vendas/${saleId}/responder-ajuste`)
		.send({ aceitar });
}

describe("proposta de ajuste", () => {
	let scenario: Scenario;

	beforeAll(async () => {
		scenario = await createScenario(2);
	});

	it("recusa dados inválidos com a lista de campos", async () => {
		const empty = await propose(scenario.seller, scenario.saleId, {
			reason: "",
			items: [],
		});
		const tooLong = await propose(scenario.seller, scenario.saleId, {
			reason: "x".repeat(501),
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});
		const decimals = await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1.2345 }],
		});
		const repeated = await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [
				{ sale_product_id: scenario.saleItemId, quantity: 1 },
				{ sale_product_id: scenario.saleItemId, quantity: 1.5 },
			],
		});

		expect(empty.status).toBe(400);
		expect(
			empty.body.errors.map((error: { field: string }) => error.field),
		).toEqual(expect.arrayContaining(["reason", "items"]));
		expect(tooLong.status).toBe(400);
		expect(decimals.status).toBe(400);
		expect(repeated.status).toBe(400);
	});

	it("recusa quantidade igual à atual e aumento acima do estoque", async () => {
		const unchanged = await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 2 }],
		});
		// Estoque restante 8: aumentar de 2 para 11 exige 9
		const overStock = await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 11 }],
		});

		expect(unchanged.status).toBe(400);
		expect(overStock.status).toBe(400);
		expect(overStock.body.errors[0].field).toBe("items.0.quantity");
	});

	it("recusa item que não é do pedido, vendedor de fora e pedido inexistente", async () => {
		const stranger = await registerUser("VENDEDOR");

		const foreignItem = await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: randomUUID(), quantity: 1 }],
		});
		const otherSeller = await propose(stranger, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});
		const missing = await propose(scenario.seller, randomUUID(), {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});

		expect(foreignItem.status).toBe(400);
		expect(otherSeller.status).toBe(403);
		expect(missing.status).toBe(404);
	});

	it("proposta válida aguarda o cliente sem alterar total nem estoque", async () => {
		const response = await propose(scenario.seller, scenario.saleId, {
			reason: "Peso real após a pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1.5 }],
		});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe("AGUARDANDO_APROVACAO_CLIENTE");
		expect(response.body.order_total).toBe(25);
		expect(response.body.pending_adjustment).toMatchObject({
			status: "PENDENTE",
			previous_status: "EM_PREPARACAO",
			current_order_total: 25,
			proposed_order_total: 20,
		});
		expect(response.body.pending_adjustment.items[0]).toMatchObject({
			original_quantity: 2,
			proposed_quantity: 1.5,
			original_unit_price: UNIT_PRICE,
			proposed_unit_price: UNIT_PRICE,
		});
		expect(await getStock(scenario.productId)).toBe(8);
	});

	it("não aceita segunda proposta nem avanço enquanto aguarda o cliente", async () => {
		const second = await propose(scenario.seller, scenario.saleId, {
			reason: "outra pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});
		const advance = await scenario.seller.client
			.patch(`/vendedor/pedidos/${scenario.saleId}/status`)
			.send({ status: "A_CAMINHO" });

		expect(second.status).toBe(409);
		expect(advance.status).toBe(400);
	});

	it("o cliente vê a proposta no histórico e o vendedor vê o indicador", async () => {
		const purchases = await scenario.customer.client.get(
			"/vendas/minhas-compras",
		);
		const purchase = purchases.body.find(
			(item: { id: string }) => item.id === scenario.saleId,
		);
		const orders = await scenario.seller.client.get("/vendedor/pedidos");
		const order = orders.body.find(
			(item: { id: string }) => item.id === scenario.saleId,
		);

		expect(purchase.pending_adjustment.proposed_order_total).toBe(20);
		expect(order.has_pending_adjustment).toBe(true);
	});

	it("pedido finalizado não aceita proposta", async () => {
		const other = await createScenario(1);
		await other.seller.client
			.patch(`/vendedor/pedidos/${other.saleId}/status`)
			.send({ status: "CANCELADA" });

		const response = await propose(other.seller, other.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: other.saleItemId, quantity: 2 }],
		});

		expect(response.status).toBe(400);
	});

	it("propostas simultâneas: uma é criada e a outra recebe 409", async () => {
		const other = await createScenario(2);
		const body = {
			reason: "pesagem",
			items: [{ sale_product_id: other.saleItemId, quantity: 1.8 }],
		};

		const responses = await Promise.all([
			propose(other.seller, other.saleId, body),
			propose(other.seller, other.saleId, body),
		]);

		expect(responses.map((response) => response.status).sort()).toEqual([
			201, 409,
		]);
	});
});

describe("resposta do cliente ao ajuste", () => {
	it("aceitar aplica quantidade, total, pagamento, estoque e volta ao status anterior", async () => {
		const scenario = await createScenario(2);
		await propose(scenario.seller, scenario.saleId, {
			reason: "Faltou peso na balança",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 3.5 }],
		});

		const response = await respond(scenario.customer, scenario.saleId, true);

		// 3,5 × 10 + frete 5
		expect(response.status).toBe(200);
		expect(response.body.status).toBe("EM_PREPARACAO");
		expect(response.body.total_amount).toBe(40);
		expect(response.body.payments[0].amount).toBe(40);
		expect(response.body.items[0].quantity).toBe(3.5);
		expect(response.body.pending_adjustment).toBeNull();
		expect(await getStock(scenario.productId)).toBe(6.5);

		const detail = await scenario.seller.client.get(
			`/vendedor/pedidos/${scenario.saleId}`,
		);
		expect(
			detail.body.status_history.map(
				(entry: { status: string }) => entry.status,
			),
		).toEqual([
			"ABERTA",
			"EM_PREPARACAO",
			"AGUARDANDO_APROVACAO_CLIENTE",
			"EM_PREPARACAO",
		]);
		expect(detail.body.status_history[3].changed_by.id).toBe(
			scenario.customer.user.id,
		);
	});

	it("aceitar uma redução devolve a diferença ao estoque", async () => {
		const scenario = await createScenario(4);
		await propose(scenario.seller, scenario.saleId, {
			reason: "Produto menor que o esperado",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 2.5 }],
		});

		const response = await respond(scenario.customer, scenario.saleId, true);

		expect(response.status).toBe(200);
		expect(response.body.total_amount).toBe(30);
		expect(await getStock(scenario.productId)).toBe(7.5);
	});

	it("recusar cancela o pedido e devolve todo o estoque uma única vez", async () => {
		const scenario = await createScenario(3);
		await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 2 }],
		});

		const response = await respond(scenario.customer, scenario.saleId, false);
		const again = await respond(scenario.customer, scenario.saleId, false);
		const cancelAgain = await scenario.seller.client
			.patch(`/vendedor/pedidos/${scenario.saleId}/status`)
			.send({ status: "CANCELADA" });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("CANCELADA");
		expect(response.body.total_amount).toBe(35);
		expect(again.status).toBe(409);
		expect(cancelAgain.status).toBe(200);
		expect(await getStock(scenario.productId)).toBe(10);
	});

	it("respostas simultâneas: uma vale, as outras recebem 409 e o estoque fica correto", async () => {
		const scenario = await createScenario(4);
		await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 3 }],
		});

		const responses = await Promise.all([
			respond(scenario.customer, scenario.saleId, true),
			respond(scenario.customer, scenario.saleId, false),
			respond(scenario.customer, scenario.saleId, true),
		]);
		const succeeded = responses.filter((response) => response.status === 200);
		const conflicts = responses.filter((response) => response.status === 409);

		expect(succeeded).toHaveLength(1);
		expect(conflicts).toHaveLength(2);
		// Aceite: 10 − 3; recusa: todo o estoque volta
		const expectedStock = succeeded[0].body.status === "CANCELADA" ? 10 : 7;
		expect(await getStock(scenario.productId)).toBe(expectedStock);
	});

	it("cliente de outro pedido recebe 404 e corpo inválido recebe 400", async () => {
		const scenario = await createScenario(2);
		await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});
		const stranger = await registerUser("CLIENTE");

		const foreign = await respond(stranger, scenario.saleId, true);
		const missing = await respond(scenario.customer, randomUUID(), true);
		const invalid = await respond(scenario.customer, scenario.saleId, "sim");

		expect(foreign.status).toBe(404);
		expect(missing.status).toBe(404);
		expect(invalid.status).toBe(400);
	});

	it("sem proposta pendente, responder devolve 409", async () => {
		const scenario = await createScenario(1);

		const response = await respond(scenario.customer, scenario.saleId, true);

		expect(response.status).toBe(409);
	});

	it("o vendedor pode cancelar enquanto aguarda o cliente, e a proposta deixa de valer", async () => {
		const scenario = await createScenario(2);
		await propose(scenario.seller, scenario.saleId, {
			reason: "pesagem",
			items: [{ sale_product_id: scenario.saleItemId, quantity: 1 }],
		});

		const canceled = await scenario.seller.client
			.patch(`/vendedor/pedidos/${scenario.saleId}/status`)
			.send({ status: "CANCELADA" });
		const late = await respond(scenario.customer, scenario.saleId, true);

		expect(canceled.status).toBe(200);
		expect(late.status).toBe(409);
		expect(await getStock(scenario.productId)).toBe(10);
	});
});
