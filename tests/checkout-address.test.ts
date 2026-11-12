import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "./helpers/client";
import {
	createProduct,
	placeOrder,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

async function getStock(productId: string): Promise<number> {
	const response = await createClient().get(`/produtos/${productId}`);
	return Number(response.body.stock);
}

describe("checkout exige endereço completo na entrega (RF-40, VER-63)", () => {
	let seller: RegisteredUser;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		await seller.client.put("/pessoa/frete").send({ fixed_shipping_rate: 10 });
	});

	it("cliente sem endereço recebe 400 na entrega e o estoque não muda", async () => {
		const customer = await registerUser("CLIENTE", { address: "nenhum" });
		const product = await createProduct(seller.client, { stock: 5 });

		await customer.client
			.post("/carrinho/itens")
			.send({ product_id: product.id, quantity: 1 });
		const response = await customer.client
			.post("/vendas/checkout")
			.send({ delivery_type: "ENTREGA", payment_method: "PIX" });

		expect(response.status).toBe(400);
		expect(response.body.message).toContain("endereço completo");
		expect(await getStock(product.id)).toBe(5);
	});

	it("cliente sem endereço consegue fechar pedido na retirada", async () => {
		const customer = await registerUser("CLIENTE", { address: "nenhum" });
		const product = await createProduct(seller.client);

		const saleId = await placeOrder(
			customer.client,
			[{ productId: product.id, quantity: 1 }],
			"RETIRADA",
		);

		expect(saleId).toEqual(expect.any(String));
	});

	it("cliente com endereço estruturado completo fecha pedido na entrega", async () => {
		const customer = await registerUser("CLIENTE", { address: "estruturado" });
		const product = await createProduct(seller.client);

		const saleId = await placeOrder(
			customer.client,
			[{ productId: product.id, quantity: 1 }],
			"ENTREGA",
		);

		expect(saleId).toEqual(expect.any(String));
	});

	it("cliente antigo com só o endereço em texto livre continua comprando na entrega", async () => {
		const customer = await registerUser("CLIENTE", { address: "legado" });
		const product = await createProduct(seller.client);

		const saleId = await placeOrder(
			customer.client,
			[{ productId: product.id, quantity: 1 }],
			"ENTREGA",
		);

		expect(saleId).toEqual(expect.any(String));
	});
});
