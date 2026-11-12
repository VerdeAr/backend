import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { userRepository } from "@/repositories/user.repository";
import { createClient } from "./helpers/client";
import {
	createProduct,
	placeOrder,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

// VER-95: máquina de estados do pedido, cancelamento atômico e detalhe do pedido do vendedor

async function getStock(productId: string): Promise<number> {
	const response = await createClient().get(`/produtos/${productId}`);
	return Number(response.body.stock);
}

function changeStatus(seller: RegisteredUser, saleId: string, status: string) {
	return seller.client
		.patch(`/vendedor/pedidos/${saleId}/status`)
		.send({ status });
}

describe("máquina de estados do pedido", () => {
	let seller: RegisteredUser;
	let customer: RegisteredUser;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");
	});

	it("na entrega, o pedido passa por preparação e a caminho até concluir", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(
			customer.client,
			[{ productId: product.id, quantity: 1 }],
			"ENTREGA",
		);

		expect((await changeStatus(seller, saleId, "EM_PREPARACAO")).status).toBe(
			200,
		);
		// Na entrega não se conclui sem passar por "A Caminho"
		expect((await changeStatus(seller, saleId, "FINALIZADA")).status).toBe(400);
		expect((await changeStatus(seller, saleId, "A_CAMINHO")).status).toBe(200);
		// Pedido a caminho não pode mais ser cancelado
		expect((await changeStatus(seller, saleId, "CANCELADA")).status).toBe(400);

		const finished = await changeStatus(seller, saleId, "FINALIZADA");
		expect(finished.status).toBe(200);
		expect(finished.body.status).toBe("FINALIZADA");
	});

	it("na retirada, não existe a etapa a caminho", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(
			customer.client,
			[{ productId: product.id, quantity: 1 }],
			"RETIRADA",
		);

		expect((await changeStatus(seller, saleId, "A_CAMINHO")).status).toBe(400);
		expect((await changeStatus(seller, saleId, "EM_PREPARACAO")).status).toBe(
			200,
		);
		expect((await changeStatus(seller, saleId, "A_CAMINHO")).status).toBe(400);
		expect((await changeStatus(seller, saleId, "FINALIZADA")).status).toBe(200);
	});

	it("o vendedor não leva o pedido a aguardar aprovação nem de volta a aberto", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 1 },
		]);

		const awaiting = await changeStatus(
			seller,
			saleId,
			"AGUARDANDO_APROVACAO_CLIENTE",
		);
		expect(awaiting.status).toBe(400);

		await changeStatus(seller, saleId, "EM_PREPARACAO");
		expect((await changeStatus(seller, saleId, "ABERTA")).status).toBe(400);
	});

	it("status desconhecido é recusado pela validação", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 1 },
		]);

		const response = await changeStatus(seller, saleId, "ENVIADO");
		expect(response.status).toBe(400);
		expect(response.body.errors).toEqual(
			expect.arrayContaining([expect.objectContaining({ field: "status" })]),
		);
	});

	it("cancelar em preparação devolve o estoque", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 4 },
		]);
		await changeStatus(seller, saleId, "EM_PREPARACAO");
		expect(await getStock(product.id)).toBe(6);

		const canceled = await changeStatus(seller, saleId, "CANCELADA");

		expect(canceled.status).toBe(200);
		expect(await getStock(product.id)).toBe(10);
	});

	it("cancelamentos repetidos e simultâneos devolvem o estoque uma única vez", async () => {
		const product = await createProduct(seller.client, { stock: 10 });
		const saleId = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 3 },
		]);
		expect(await getStock(product.id)).toBe(7);

		const responses = await Promise.all([
			changeStatus(seller, saleId, "CANCELADA"),
			changeStatus(seller, saleId, "CANCELADA"),
			changeStatus(seller, saleId, "CANCELADA"),
		]);
		const again = await changeStatus(seller, saleId, "CANCELADA");

		// Repetir o status atual não altera nada; nenhuma chamada pode falhar com 500
		for (const response of [...responses, again]) {
			expect(response.status).toBe(200);
		}
		expect(await getStock(product.id)).toBe(10);
	});

	it("o contador de pendentes considera pedidos abertos e em preparação", async () => {
		const counterSeller = await registerUser("VENDEDOR");
		const product = await createProduct(counterSeller.client, { stock: 10 });
		const opened = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 1 },
		]);
		const preparing = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 1 },
		]);
		const finished = await placeOrder(customer.client, [
			{ productId: product.id, quantity: 1 },
		]);
		await changeStatus(counterSeller, preparing, "EM_PREPARACAO");
		await changeStatus(counterSeller, finished, "FINALIZADA");

		const response = await counterSeller.client.get(
			"/vendedor/pedidos/pendentes/count",
		);

		expect(opened).toEqual(expect.any(String));
		expect(response.status).toBe(200);
		expect(response.body.count).toBe(2);
	});
});

describe("detalhe do pedido do vendedor", () => {
	let seller: RegisteredUser;
	let otherSeller: RegisteredUser;
	let customer: RegisteredUser;
	let saleId: string;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		otherSeller = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");

		const own = await createProduct(seller.client, { price: 9, stock: 10 });
		const foreign = await createProduct(otherSeller.client, {
			price: 4,
			stock: 10,
		});
		saleId = await placeOrder(
			customer.client,
			[
				{ productId: own.id, quantity: 2 },
				{ productId: foreign.id, quantity: 1 },
			],
			"RETIRADA",
			"PIX",
		);
		await changeStatus(seller, saleId, "EM_PREPARACAO");
	});

	it("mostra só os itens do vendedor, o histórico e a forma de pagamento", async () => {
		const response = await seller.client.get(`/vendedor/pedidos/${saleId}`);

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("EM_PREPARACAO");
		expect(response.body.payment_method).toBe("PIX");
		expect(response.body.items).toHaveLength(1);
		expect(response.body.items[0]).toMatchObject({
			quantity: 2,
			unit_price: 9,
			total: 18,
		});
		expect(response.body.seller_subtotal).toBe(18);
		expect(response.body.order_total).toBe(22);
		expect(response.body.pending_adjustment).toBeNull();
		expect(
			response.body.status_history.map(
				(entry: { status: string }) => entry.status,
			),
		).toEqual(["ABERTA", "EM_PREPARACAO"]);
		expect(response.body.status_history[1].changed_by.id).toBe(seller.user.id);
	});

	it("não expõe dados sensíveis do cliente", async () => {
		const response = await seller.client.get(`/vendedor/pedidos/${saleId}`);

		expect(Object.keys(response.body.customer).sort()).toEqual([
			"address",
			"email",
			"id",
			"name",
			"neighborhood",
			"phone",
		]);
		expect(JSON.stringify(response.body)).not.toMatch(/password|cpf/);
	});

	it("devolve o endereço estruturado do cliente formatado", async () => {
		// Simula um cadastro com endereço estruturado e sem o texto legado (como os
		// usuários criados antes do address derivado): o detalhe não pode depender dele
		await userRepository.update(customer.user.id, { address: null });

		const response = await seller.client.get(`/vendedor/pedidos/${saleId}`);

		expect(response.status).toBe(200);
		expect(response.body.customer.address).toBe(
			"Rua dos Testes, 100 - Cornélio Procópio - PR - CEP: 86300-000",
		);
	});

	it("cliente legado (só address) tem o texto antigo no detalhe", async () => {
		const legacyCustomer = await registerUser("CLIENTE", { address: "legado" });
		const product = await createProduct(seller.client, { stock: 5 });
		const legacySaleId = await placeOrder(legacyCustomer.client, [
			{ productId: product.id, quantity: 1 },
		]);

		const response = await seller.client.get(
			`/vendedor/pedidos/${legacySaleId}`,
		);

		expect(response.status).toBe(200);
		expect(response.body.customer.address).toBe(
			"Rua dos Testes Legado, 200 - Centro",
		);
	});

	it("vendedor sem itens no pedido recebe 403", async () => {
		const stranger = await registerUser("VENDEDOR");

		const response = await stranger.client.get(`/vendedor/pedidos/${saleId}`);

		expect(response.status).toBe(403);
	});

	it("pedido inexistente devolve 404 e ID inválido devolve 400", async () => {
		const missing = await seller.client.get(
			`/vendedor/pedidos/${randomUUID()}`,
		);
		const invalid = await seller.client.get("/vendedor/pedidos/abc");

		expect(missing.status).toBe(404);
		expect(invalid.status).toBe(400);
	});

	it("cliente não acessa o detalhe do vendedor", async () => {
		const response = await customer.client.get(`/vendedor/pedidos/${saleId}`);

		expect(response.status).toBe(403);
	});
});
