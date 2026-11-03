import { describe, expect, it } from "vitest";
import { productFilterQuerySchema } from "@/schemas/product.schema";
import { createClient } from "./helpers/client";
import { registerUser } from "./helpers/factories";

describe("ajustes de loaders, paginação e cache (VER-52)", () => {
	describe("schema de filtros de produtos", () => {
		it("limita ?limit=100000 ao teto máximo de 100", () => {
			const parsed = productFilterQuerySchema.parse({ limit: 100000 });
			expect(parsed.limit).toBe(100);
		});

		it("aplica padrão 12 para limit ausente, vazio ou inválido", () => {
			expect(productFilterQuerySchema.parse({}).limit).toBe(12);
			expect(productFilterQuerySchema.parse({ limit: "" }).limit).toBe(12);
			expect(productFilterQuerySchema.parse({ limit: 0 }).limit).toBe(12);
			expect(productFilterQuerySchema.parse({ limit: -5 }).limit).toBe(12);
		});

		it("arredonda pagina e page fracionados para inteiro com Math.floor", () => {
			const parsed = productFilterQuerySchema.parse({
				pagina: "1.5",
				page: "2.8",
			});
			expect(parsed.pagina).toBe(1);
			expect(parsed.page).toBe(2);
		});

		it("converte pagina ou page menores que 1 para o mínimo 1", () => {
			const parsed = productFilterQuerySchema.parse({
				pagina: 0,
				page: -3,
			});
			expect(parsed.pagina).toBe(1);
			expect(parsed.page).toBe(1);
		});

		it("converte string vazia para undefined em pagina e page", () => {
			const parsed = productFilterQuerySchema.parse({
				pagina: "",
				page: "",
			});
			expect(parsed.pagina).toBeUndefined();
			expect(parsed.page).toBeUndefined();
		});

		it("converte string vazia para undefined em categoriaId, categoria e category_id", () => {
			const parsed = productFilterQuerySchema.parse({
				categoriaId: "",
				categoria: "",
				category_id: "",
			});
			expect(parsed.categoriaId).toBeUndefined();
			expect(parsed.categoria).toBeUndefined();
			expect(parsed.category_id).toBeUndefined();
		});
	});

	describe("cabeçalhos de Cache-Control e revalidação ETag", () => {
		it("GET /categorias devolve Cache-Control: public, max-age=300 e ETag", async () => {
			const visitor = createClient();
			const response = await visitor.get("/categorias");

			expect(response.status).toBe(200);
			expect(response.headers["cache-control"]).toBe("public, max-age=300");
			expect(response.headers.etag).toBeDefined();

			const revalidation = await visitor
				.get("/categorias")
				.set("If-None-Match", response.headers.etag);
			expect(revalidation.status).toBe(304);
		});

		it("GET /unidades-medida devolve Cache-Control: public, max-age=300 e ETag", async () => {
			const visitor = createClient();
			const response = await visitor.get("/unidades-medida");

			expect(response.status).toBe(200);
			expect(response.headers["cache-control"]).toBe("public, max-age=300");
			expect(response.headers.etag).toBeDefined();

			const revalidation = await visitor
				.get("/unidades-medida")
				.set("If-None-Match", response.headers.etag);
			expect(revalidation.status).toBe(304);
		});

		it("GET /produtos devolve Cache-Control: no-cache e suporta If-None-Match", async () => {
			const visitor = createClient();
			const response = await visitor.get("/produtos");

			expect(response.status).toBe(200);
			expect(response.headers["cache-control"]).toBe("no-cache");
			expect(response.headers.etag).toBeDefined();

			const revalidation = await visitor
				.get("/produtos")
				.set("If-None-Match", response.headers.etag);
			expect(revalidation.status).toBe(304);
		});

		it("GET /carrinho devolve Cache-Control: private, no-cache", async () => {
			const customer = await registerUser("CLIENTE");
			const response = await customer.client.get("/carrinho");

			expect(response.status).toBe(200);
			expect(response.headers["cache-control"]).toBe("private, no-cache");
		});
	});
});
