import SwaggerParser from "@apidevtools/swagger-parser";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "@/app";
import { swaggerDoc } from "@/config/swagger";
import { collectApiRoutes, collectDocumentedRoutes } from "./helpers/routes";

// Rotas que existem na API, mas ainda não estão no Swagger. A VER-101 documenta todas
// e esvazia esta lista; até lá, o teste garante que nenhuma rota nova fique de fora.
const PENDING_DOCUMENTATION = [
	"GET /avaliacoes/produto/{productId}",
	"GET /avaliacoes/vendedor/{sellerId}",
	"POST /auth/logout",
	"POST /avaliacoes",
];

describe("documentação Swagger", () => {
	it("o documento é um OpenAPI válido", async () => {
		// O parser altera o objeto recebido, então valida uma cópia
		const document = JSON.parse(JSON.stringify(swaggerDoc));

		await expect(SwaggerParser.validate(document)).resolves.toBeDefined();
	});

	it("a interface do Swagger responde em /docs", async () => {
		const response = await request(app).get("/docs/");

		expect(response.status).toBe(200);
		expect(response.type).toBe("text/html");
	});

	it("não documenta rotas que não existem mais", () => {
		const real = new Set(collectApiRoutes());
		const documented = collectDocumentedRoutes(swaggerDoc.paths);

		const stale = documented.filter((route) => !real.has(route));

		expect(stale).toEqual([]);
	});

	it("documenta todas as rotas existentes, exceto as pendentes", () => {
		const documented = new Set(collectDocumentedRoutes(swaggerDoc.paths));

		const undocumented = collectApiRoutes().filter(
			(route) => !documented.has(route),
		);

		expect(undocumented).toEqual(PENDING_DOCUMENTATION);
	});
});
