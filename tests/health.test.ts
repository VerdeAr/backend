import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "@/app";
import { AppDataSource } from "@/config/database";

describe("endpoints de saúde", () => {
	it("GET /health responde 200 sem depender do banco", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body.status).toBe("ok");
		expect(response.body.uptime).toEqual(expect.any(Number));
	});

	it("GET /ready responde 200 quando o banco está disponível", async () => {
		const response = await request(app).get("/ready");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: "ready", database: "up" });
	});

	it("GET /ready responde 503 quando o banco não está disponível", async () => {
		await AppDataSource.destroy();

		try {
			const response = await request(app).get("/ready");

			expect(response.status).toBe(503);
			expect(response.body).toEqual({
				status: "unavailable",
				database: "down",
			});
		} finally {
			// Restaura a conexão para os demais testes do arquivo
			await AppDataSource.initialize();
		}
	});

	it("GET /health continua respondendo 200 com o banco indisponível", async () => {
		await AppDataSource.destroy();

		try {
			const response = await request(app).get("/health");

			expect(response.status).toBe(200);
		} finally {
			await AppDataSource.initialize();
		}
	});
});
