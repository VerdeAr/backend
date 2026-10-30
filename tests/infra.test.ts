import { describe, expect, it } from "vitest";
import { AppError } from "@/errors/AppError";
import { loginAs, registerUser } from "./helpers/factories";

describe("infraestrutura de testes", () => {
	it("resolve o alias @ para a pasta src", () => {
		const error = new AppError("falha de teste", 409);

		expect(error.message).toBe("falha de teste");
		expect(error.statusCode).toBe(409);
	});

	it("usa um banco exclusivo de testes", () => {
		expect(process.env.DB_NAME).toMatch(/_test$/);
	});

	it("aplica as migrations e o seed antes da suíte", async () => {
		const { client } = await registerUser("CLIENTE");

		const categories = await client.get("/categorias");
		const units = await client.get("/unidades-medida");

		expect(categories.status).toBe(200);
		expect(categories.body.length).toBeGreaterThanOrEqual(8);
		expect(units.status).toBe(200);
		expect(units.body.length).toBeGreaterThanOrEqual(8);
	});

	it("cadastra um usuário e mantém a sessão pelo cookie", async () => {
		const { client, credentials, user } = await registerUser("VENDEDOR");

		const me = await client.get("/auth/me");

		expect(me.status).toBe(200);
		expect(me.body.id).toBe(user.id);
		expect(me.body.role).toBe("VENDEDOR");
		expect(me.body.email).toBe(credentials.email);
	});

	it("faz login com um cliente novo", async () => {
		const { credentials } = await registerUser("CLIENTE");

		const client = await loginAs(credentials);
		const me = await client.get("/auth/me");

		expect(me.status).toBe(200);
		expect(me.body.email).toBe(credentials.email);
	});
});
