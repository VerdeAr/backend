import { beforeAll, describe, expect, it } from "vitest";
import {
	type CreatedProduct,
	createProduct,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

// VER-108: as respostas do chat não podem expor dados pessoais nem credenciais dos participantes

const SENSITIVE_KEYS = ["password", "cpf", "email", "phone", "cnpj"];

// Percorre a resposta inteira e devolve o caminho de cada chave sensível encontrada
function findSensitiveKeys(value: unknown, path = "body"): string[] {
	if (Array.isArray(value)) {
		return value.flatMap((item, index) =>
			findSensitiveKeys(item, `${path}[${index}]`),
		);
	}

	if (value !== null && typeof value === "object") {
		return Object.entries(value).flatMap(([key, child]) => {
			const childPath = `${path}.${key}`;
			const own = SENSITIVE_KEYS.includes(key) ? [childPath] : [];
			return [...own, ...findSensitiveKeys(child, childPath)];
		});
	}

	return [];
}

describe("privacidade dos participantes no chat", () => {
	let seller: RegisteredUser;
	let customer: RegisteredUser;
	let product: CreatedProduct;
	let chatId: string;

	beforeAll(async () => {
		seller = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");
		product = await createProduct(seller.client);
	});

	it("POST /chats devolve o chat sem dados sensíveis, mantendo os públicos", async () => {
		const response = await customer.client
			.post("/chats")
			.send({ product_id: product.id });

		expect(response.status).toBe(201);
		expect(findSensitiveKeys(response.body)).toEqual([]);

		chatId = response.body.id;
		expect(response.body.status).toBe("ATIVO");
		expect(response.body.customer).toMatchObject({
			id: customer.user.id,
			name: customer.credentials.name,
		});
		expect(response.body.seller).toMatchObject({
			user_id: seller.user.id,
			farm_name: expect.any(String),
		});
		expect(response.body.seller.user).toMatchObject({
			id: seller.user.id,
			name: seller.credentials.name,
		});
	});

	it("POST /chats/:id/messages devolve a mensagem sem dados do remetente", async () => {
		const fromCustomer = await customer.client
			.post(`/chats/${chatId}/messages`)
			.send({ content: "Olá, o tomate ainda está disponível?" });
		const fromSeller = await seller.client
			.post(`/chats/${chatId}/messages`)
			.send({ content: "Está sim!" });

		for (const response of [fromCustomer, fromSeller]) {
			expect(response.status).toBe(201);
			expect(findSensitiveKeys(response.body)).toEqual([]);
		}
		expect(fromSeller.body.sender).toMatchObject({
			id: seller.user.id,
			name: seller.credentials.name,
		});
	});

	it("GET /chats não expõe o outro participante para nenhum dos lados", async () => {
		for (const participant of [customer, seller]) {
			const response = await participant.client.get("/chats");

			expect(response.status).toBe(200);
			expect(findSensitiveKeys(response.body)).toEqual([]);

			const chat = response.body.find(
				(item: { id: string }) => item.id === chatId,
			);
			expect(chat.customer.name).toBe(customer.credentials.name);
			expect(chat.seller.user.name).toBe(seller.credentials.name);
		}
	});

	it("GET /chats/:id não expõe dados sensíveis", async () => {
		const response = await seller.client.get(`/chats/${chatId}`);

		expect(response.status).toBe(200);
		expect(findSensitiveKeys(response.body)).toEqual([]);
		expect(response.body.customer.name).toBe(customer.credentials.name);
	});

	it("GET /chats/:id/messages não expõe dados do remetente", async () => {
		const response = await customer.client.get(`/chats/${chatId}/messages`);

		expect(response.status).toBe(200);
		expect(response.body.messages).toHaveLength(2);
		expect(findSensitiveKeys(response.body)).toEqual([]);
		expect(
			response.body.messages.map(
				(m: { sender: { name: string } }) => m.sender.name,
			),
		).toEqual(
			expect.arrayContaining([
				customer.credentials.name,
				seller.credentials.name,
			]),
		);
	});

	it("PATCH /chats/:id/finish devolve o chat finalizado sem dados sensíveis", async () => {
		const response = await customer.client.patch(`/chats/${chatId}/finish`);

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("FINALIZADO");
		expect(findSensitiveKeys(response.body)).toEqual([]);
	});
});
