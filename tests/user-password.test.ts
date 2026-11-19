import { beforeAll, describe, expect, it } from "vitest";
import { createClient } from "./helpers/client";
import { type RegisteredUser, registerUser } from "./helpers/factories";

// VER-108: o hash da senha fica fora das consultas por padrão (select: false),
// mas o login e a troca de senha continuam conferindo a credencial

describe("senha oculta por padrão", () => {
	let customer: RegisteredUser;

	beforeAll(async () => {
		customer = await registerUser("CLIENTE");
	});

	it("o cadastro, o login e o perfil não devolvem o hash da senha", async () => {
		const login = await createClient().post("/auth/login").send({
			email: customer.credentials.email,
			password: customer.credentials.password,
		});
		const me = await customer.client.get("/auth/me");

		expect(login.status).toBe(200);
		expect(me.status).toBe(200);
		expect(customer.user).not.toHaveProperty("password");
		expect(JSON.stringify(login.body)).not.toMatch(/password/);
		expect(JSON.stringify(me.body)).not.toMatch(/password/);
	});

	it("o login com a senha errada continua recusado", async () => {
		const response = await createClient().post("/auth/login").send({
			email: customer.credentials.email,
			password: "senha-incorreta",
		});

		expect(response.status).toBe(401);
	});

	it("a troca de senha confere a senha atual", async () => {
		const response = await customer.client.put("/pessoa/senha").send({
			current_password: "senha-incorreta",
			new_password: "nova-senha-123",
			confirm_password: "nova-senha-123",
		});

		expect(response.status).toBe(400);
	});

	it("a troca de senha com a senha atual correta permite entrar com a nova", async () => {
		const troca = await customer.client.put("/pessoa/senha").send({
			current_password: customer.credentials.password,
			new_password: "nova-senha-123",
			confirm_password: "nova-senha-123",
		});
		expect(troca.status).toBe(200);

		const comNova = await createClient().post("/auth/login").send({
			email: customer.credentials.email,
			password: "nova-senha-123",
		});
		const comAntiga = await createClient().post("/auth/login").send({
			email: customer.credentials.email,
			password: customer.credentials.password,
		});

		expect(comNova.status).toBe(200);
		expect(comAntiga.status).toBe(401);
	});
});
