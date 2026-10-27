import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "./helpers/client";
import {
	createProduct,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

const SHIPPING_RATE = 12.5;
const UNIT_PRICE = 8.5;
const INITIAL_STOCK = 10;

async function getStock(productId: string): Promise<number> {
	const response = await createClient().get(`/produtos/${productId}`);
	return Number(response.body.stock);
}

describe("fluxo principal: vendedor publica, cliente compra e avalia", () => {
	let seller: RegisteredUser;
	let customer: RegisteredUser;
	let product: { id: string; name: string };
	let saleId: string;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");
	});

	it("o vendedor define o frete fixo", async () => {
		const response = await seller.client
			.put("/pessoa/frete")
			.send({ fixed_shipping_rate: SHIPPING_RATE });

		expect(response.status).toBe(200);
		expect(Number(response.body.fixed_shipping_rate)).toBe(SHIPPING_RATE);
	});

	it("o vendedor publica um produto", async () => {
		product = await createProduct(seller.client, {
			price: UNIT_PRICE,
			stock: INITIAL_STOCK,
		});

		expect(product.id).toEqual(expect.any(String));
	});

	it("o produto aparece na vitrine pública, sem avaliações", async () => {
		const visitor = createClient();

		const list = await visitor.get("/produtos").query({ search: product.name });
		const detail = await visitor.get(`/produtos/${product.id}`);

		expect(list.status).toBe(200);
		expect(
			list.body.data.some((item: { id: string }) => item.id === product.id),
		).toBe(true);
		expect(detail.status).toBe(200);
		expect(detail.body.average_rating).toBe(0);
		expect(detail.body.review_count).toBe(0);
	});

	it("o cliente adiciona o produto ao carrinho", async () => {
		const response = await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 2 });

		expect(response.status).toBe(200);
		expect(response.body.items).toHaveLength(1);
		expect(response.body.total_items).toBe(2);
		expect(response.body.subtotal).toBeCloseTo(UNIT_PRICE * 2);
	});

	it("o frete é somado ao escolher entrega e a forma de pagamento é salva", async () => {
		await customer.client
			.post("/carrinho/entrega")
			.send({ delivery_type: "ENTREGA" });
		const response = await customer.client
			.post("/carrinho/pagamento")
			.send({ payment_method: "PIX" });

		expect(response.status).toBe(200);
		expect(response.body.delivery_type).toBe("ENTREGA");
		expect(response.body.payment_method).toBe("PIX");
		expect(response.body.shipping).toBeCloseTo(SHIPPING_RATE);
		expect(response.body.total).toBeCloseTo(UNIT_PRICE * 2 + SHIPPING_RATE);
	});

	it("o checkout cria o pedido em aberto, baixa o estoque e esvazia o carrinho", async () => {
		const response = await customer.client.post("/vendas/checkout").send({});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe("ABERTA");
		expect(Number(response.body.total_amount)).toBeCloseTo(
			UNIT_PRICE * 2 + SHIPPING_RATE,
		);
		saleId = response.body.id;

		const cart = await customer.client.get("/carrinho");
		expect(cart.body.items).toHaveLength(0);
		expect(await getStock(product.id)).toBe(INITIAL_STOCK - 2);
	});

	it("o cliente vê a compra no histórico com o pagamento registrado", async () => {
		const response = await customer.client.get("/vendas/minhas-compras");

		expect(response.status).toBe(200);
		const purchase = response.body.find(
			(item: { id: string }) => item.id === saleId,
		);
		expect(purchase).toBeDefined();
		expect(purchase.status).toBe("ABERTA");
		expect(purchase.items).toHaveLength(1);
		expect(purchase.payments[0].payment_method).toBe("PIX");
	});

	it("o vendedor vê o pedido pendente", async () => {
		const orders = await seller.client
			.get("/vendedor/pedidos")
			.query({ status: "ABERTA" });
		const pending = await seller.client.get(
			"/vendedor/pedidos/pendentes/count",
		);

		expect(orders.status).toBe(200);
		expect(
			orders.body.some((order: { id: string }) => order.id === saleId),
		).toBe(true);
		expect(pending.status).toBe(200);
		expect(pending.body.count).toBeGreaterThanOrEqual(1);
	});

	it("o cliente não avalia um pedido que ainda não foi finalizado", async () => {
		const response = await customer.client
			.post("/avaliacoes")
			.send({ sale_id: saleId, rating: 5 });

		expect(response.status).toBe(400);
	});

	it("o vendedor finaliza o pedido", async () => {
		const response = await seller.client
			.patch(`/vendedor/pedidos/${saleId}/status`)
			.send({ status: "FINALIZADA" });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("FINALIZADA");
	});

	it("o cliente avalia o pedido finalizado", async () => {
		const response = await customer.client
			.post("/avaliacoes")
			.send({ sale_id: saleId, rating: 5, comment: "Produto fresquinho" });

		expect(response.status).toBe(201);
		expect(response.body.rating).toBe(5);
	});

	it("não permite avaliar o mesmo pedido duas vezes", async () => {
		const response = await customer.client
			.post("/avaliacoes")
			.send({ sale_id: saleId, rating: 1 });

		expect(response.status).toBe(400);
	});

	it("a média de avaliações aparece no produto e na lista pública", async () => {
		const visitor = createClient();

		const detail = await visitor.get(`/produtos/${product.id}`);
		const reviews = await visitor.get(`/avaliacoes/produto/${product.id}`);

		expect(detail.body.average_rating).toBe(5);
		expect(detail.body.review_count).toBe(1);
		expect(reviews.status).toBe(200);
		expect(reviews.body).toHaveLength(1);
		expect(reviews.body[0].comment).toBe("Produto fresquinho");
	});
});

describe("fluxo principal: casos de erro e cancelamento", () => {
	let seller: RegisteredUser;
	let customer: RegisteredUser;
	let product: { id: string; name: string };

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");
		product = await createProduct(seller.client, { stock: 5 });
	});

	it("o carrinho exige autenticação", async () => {
		const response = await createClient().get("/carrinho");

		expect(response.status).toBe(401);
	});

	it("o checkout é bloqueado com o carrinho vazio", async () => {
		const response = await customer.client.post("/vendas/checkout").send({});

		expect(response.status).toBe(400);
	});

	it("um cliente não acessa rotas de vendedor", async () => {
		const products = await customer.client.get("/vendedor/produtos");
		const orders = await customer.client.get("/vendedor/pedidos");

		expect(products.status).toBe(403);
		expect(orders.status).toBe(403);
	});

	it("recusa quantidade acima do estoque", async () => {
		const response = await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 6 });

		expect(response.status).toBe(400);
	});

	it("cancelar um pedido devolve o estoque e o status final não muda", async () => {
		await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 3 });
		await customer.client
			.post("/carrinho/entrega")
			.send({ delivery_type: "RETIRADA" });

		const checkout = await customer.client
			.post("/vendas/checkout")
			.send({ payment_method: "Dinheiro" });
		expect(checkout.status).toBe(201);
		expect(await getStock(product.id)).toBe(2);

		const canceled = await seller.client
			.patch(`/vendedor/pedidos/${checkout.body.id}/status`)
			.send({ status: "CANCELADA" });
		expect(canceled.status).toBe(200);
		expect(canceled.body.status).toBe("CANCELADA");
		expect(await getStock(product.id)).toBe(5);

		const again = await seller.client
			.patch(`/vendedor/pedidos/${checkout.body.id}/status`)
			.send({ status: "FINALIZADA" });
		expect(again.status).toBe(400);
	});

	it("outro cliente não avalia uma compra que não é dele", async () => {
		await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 1 });
		await customer.client
			.post("/carrinho/entrega")
			.send({ delivery_type: "RETIRADA" });
		const checkout = await customer.client.post("/vendas/checkout").send({});
		await seller.client
			.patch(`/vendedor/pedidos/${checkout.body.id}/status`)
			.send({ status: "FINALIZADA" });

		const stranger = await registerUser("CLIENTE");
		const response = await stranger.client
			.post("/avaliacoes")
			.send({ sale_id: checkout.body.id, rating: 4 });

		expect(response.status).toBe(404);
	});
});
