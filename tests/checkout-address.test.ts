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

// Endereço estruturado completo, usado para montar os casos incompletos a partir dele
const COMPLETE_ADDRESS = {
	zip_code: "86300-000",
	street: "Rua dos Testes",
	number: "100",
	city: "Cornélio Procópio",
	state: "PR",
};

describe("checkout exige endereço completo na entrega (RF-40, VER-63)", () => {
	let seller: RegisteredUser;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		await seller.client.put("/pessoa/frete").send({ fixed_shipping_rate: 10 });
	});

	// Tenta fechar a entrega e devolve a resposta do checkout, sem exigir sucesso
	async function checkoutEntrega(customer: RegisteredUser, productId: string) {
		await customer.client
			.post("/carrinho/itens")
			.send({ product_id: productId, quantity: 1 });
		return customer.client
			.post("/vendas/checkout")
			.send({ delivery_type: "ENTREGA", payment_method: "PIX" });
	}

	// Cliente sem endereço que recebe só os campos informados pelo perfil
	async function customerWithProfileAddress(
		fields: Record<string, string | null>,
	): Promise<RegisteredUser> {
		const customer = await registerUser("CLIENTE", { address: "nenhum" });
		const update = await customer.client.put("/pessoa/cadastro").send(fields);
		expect(update.status).toBe(200);
		return customer;
	}

	it("cliente sem endereço recebe 400 na entrega e o estoque não muda", async () => {
		const customer = await registerUser("CLIENTE", { address: "nenhum" });
		const product = await createProduct(seller.client, { stock: 5 });

		const response = await checkoutEntrega(customer, product.id);

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

	describe("endereço estruturado incompleto não vale como endereço", () => {
		// O `address` é derivado dos campos estruturados, então um endereço incompleto
		// também gera texto nele; a entrega precisa recusar esses casos
		const incompleteCases: Array<[string, Record<string, string>]> = [
			["só o CEP", { zip_code: COMPLETE_ADDRESS.zip_code }],
			["só a cidade", { city: COMPLETE_ADDRESS.city }],
			["só a UF", { state: COMPLETE_ADDRESS.state }],
			[
				"CEP e rua, sem número, cidade e UF",
				{
					zip_code: COMPLETE_ADDRESS.zip_code,
					street: COMPLETE_ADDRESS.street,
				},
			],
			[
				"tudo, menos o número",
				{
					zip_code: COMPLETE_ADDRESS.zip_code,
					street: COMPLETE_ADDRESS.street,
					city: COMPLETE_ADDRESS.city,
					state: COMPLETE_ADDRESS.state,
				},
			],
		];

		it.each(incompleteCases)(
			"recebe 400 na entrega com %s e o estoque não muda",
			async (_name, fields) => {
				const customer = await customerWithProfileAddress(fields);
				const product = await createProduct(seller.client, { stock: 5 });

				const response = await checkoutEntrega(customer, product.id);

				expect(response.status).toBe(400);
				expect(response.body.message).toContain("endereço completo");
				expect(await getStock(product.id)).toBe(5);
			},
		);

		it("endereço completo que apaga o número pelo perfil recebe 400 na entrega", async () => {
			const customer = await registerUser("CLIENTE", {
				address: "estruturado",
			});
			const update = await customer.client
				.put("/pessoa/cadastro")
				.send({ number: null });
			expect(update.status).toBe(200);
			const product = await createProduct(seller.client, { stock: 5 });

			const response = await checkoutEntrega(customer, product.id);

			expect(response.status).toBe(400);
			expect(response.body.message).toContain("endereço completo");
			expect(await getStock(product.id)).toBe(5);
		});

		it("endereço incompleto não impede a retirada", async () => {
			const customer = await customerWithProfileAddress({
				zip_code: COMPLETE_ADDRESS.zip_code,
			});
			const product = await createProduct(seller.client);

			const saleId = await placeOrder(
				customer.client,
				[{ productId: product.id, quantity: 1 }],
				"RETIRADA",
			);

			expect(saleId).toEqual(expect.any(String));
		});

		it("completar o endereço pelo perfil libera a entrega", async () => {
			const customer = await customerWithProfileAddress({
				zip_code: COMPLETE_ADDRESS.zip_code,
			});
			const completed = await customer.client
				.put("/pessoa/cadastro")
				.send(COMPLETE_ADDRESS);
			expect(completed.status).toBe(200);
			const product = await createProduct(seller.client);

			const saleId = await placeOrder(
				customer.client,
				[{ productId: product.id, quantity: 1 }],
				"ENTREGA",
			);

			expect(saleId).toEqual(expect.any(String));
		});
	});
});
