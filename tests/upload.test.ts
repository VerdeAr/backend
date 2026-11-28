import process from "node:process";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createClient } from "./helpers/client";
import { type RegisteredUser, registerUser } from "./helpers/factories";

// A assinatura da URL é feita localmente pelo SDK, sem rede: as credenciais são falsas
// e nenhum pedido chega à R2 real.
const FAKE_R2 = {
	R2_ACCOUNT_ID: "conta-de-teste",
	R2_ACCESS_KEY_ID: "chave-de-acesso-de-teste",
	R2_SECRET_ACCESS_KEY: "segredo-de-teste-que-nunca-pode-vazar",
	R2_BUCKET: "verdear-images-test",
	R2_PUBLIC_URL: "https://imagens.teste",
};

const R2_VARIABLES = Object.keys(FAKE_R2) as (keyof typeof FAKE_R2)[];
const ROUTE = "/upload/presigned-url";
const VALID_BODY = { contentType: "image/jpeg", size: 482_113 };

const previousEnv = { ...process.env };
const consoleError = vi.spyOn(console, "error");

function useFakeR2() {
	Object.assign(process.env, FAKE_R2);
}

beforeAll(() => {
	consoleError.mockImplementation(() => {});
});

beforeEach(() => {
	useFakeR2();
	consoleError.mockClear();
});

afterAll(() => {
	vi.restoreAllMocks();
	process.env = previousEnv;
});

describe("POST /upload/presigned-url", () => {
	let seller: RegisteredUser;
	let customer: RegisteredUser;

	beforeAll(async () => {
		[seller, customer] = await Promise.all([
			registerUser("VENDEDOR"),
			registerUser("CLIENTE"),
		]);
	});

	it("vendedor recebe uploadUrl assinada por 300 s e fileUrl pública", async () => {
		const response = await seller.client.post(ROUTE).send({
			...VALID_BODY,
			filename: "alface.jpg",
		});

		expect(response.status).toBe(200);
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(Object.keys(response.body).sort()).toEqual(["fileUrl", "uploadUrl"]);

		const keyPattern = new RegExp(
			`^products/${seller.user.id}/[0-9a-f-]{36}\\.jpg$`,
		);

		const fileUrl = new URL(response.body.fileUrl);
		expect(fileUrl.origin).toBe(FAKE_R2.R2_PUBLIC_URL);
		expect(fileUrl.pathname.slice(1)).toMatch(keyPattern);

		const uploadUrl = new URL(response.body.uploadUrl);
		expect(uploadUrl.host).toBe(
			`${FAKE_R2.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		);
		// Mesma chave nos dois endereços, com o bucket no caminho
		expect(uploadUrl.pathname).toBe(`/${FAKE_R2.R2_BUCKET}${fileUrl.pathname}`);
		expect(uploadUrl.searchParams.get("X-Amz-Expires")).toBe("300");

		// Tipo e tamanho fazem parte da assinatura: a R2 recusa um PUT diferente
		const signedHeaders =
			uploadUrl.searchParams.get("X-Amz-SignedHeaders")?.split(";") ?? [];
		expect(signedHeaders).toEqual(
			expect.arrayContaining(["content-type", "content-length", "host"]),
		);

		// Sem cabeçalhos de checksum, que fazem o PUT do navegador falhar na R2
		for (const param of uploadUrl.searchParams.keys()) {
			expect(param.toLowerCase()).not.toContain("checksum");
		}

		expect(JSON.stringify(response.body)).not.toContain(
			FAKE_R2.R2_SECRET_ACCESS_KEY,
		);
	});

	it("deriva a extensão do contentType (png e webp)", async () => {
		const png = await seller.client
			.post(ROUTE)
			.send({ contentType: "image/png", size: 1_000 });
		const webp = await seller.client
			.post(ROUTE)
			.send({ contentType: "image/webp", size: 1_000 });

		expect(png.status).toBe(200);
		expect(png.body.fileUrl).toMatch(/\.png$/);
		expect(webp.status).toBe(200);
		expect(webp.body.fileUrl).toMatch(/\.webp$/);
	});

	it("o mesmo filename gera arquivos diferentes, sem usar o nome enviado", async () => {
		const body = { ...VALID_BODY, filename: "../../outro-vendedor/foto.jpg" };

		const first = await seller.client.post(ROUTE).send(body);
		const second = await seller.client.post(ROUTE).send(body);

		expect(first.status).toBe(200);
		expect(second.status).toBe(200);
		expect(first.body.fileUrl).not.toBe(second.body.fileUrl);
		expect(first.body.fileUrl).not.toContain("foto");
		expect(first.body.fileUrl).not.toContain("..");
	});

	it("tipos fora da lista respondem 400 (PDF, EXE, GIF)", async () => {
		for (const contentType of [
			"application/pdf",
			"application/x-msdownload",
			"image/gif",
		]) {
			const response = await seller.client
				.post(ROUTE)
				.send({ contentType, size: 1_000 });

			expect(response.status).toBe(400);
			expect(response.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ field: "contentType" }),
				]),
			);
		}
	});

	it("tamanho acima de 5 MB, zero ou fracionado responde 400", async () => {
		for (const size of [5 * 1024 * 1024 + 1, 0, 10.5]) {
			const response = await seller.client
				.post(ROUTE)
				.send({ contentType: "image/png", size });

			expect(response.status).toBe(400);
			expect(response.body.errors).toEqual(
				expect.arrayContaining([expect.objectContaining({ field: "size" })]),
			);
		}

		const limit = await seller.client
			.post(ROUTE)
			.send({ contentType: "image/png", size: 5 * 1024 * 1024 });
		expect(limit.status).toBe(200);
	});

	it("corpo vazio responde 400 com a lista de campos", async () => {
		const response = await seller.client.post(ROUTE).send({});

		expect(response.status).toBe(400);
		const fields = response.body.errors.map(
			(error: { field: string }) => error.field,
		);
		expect(fields).toEqual(expect.arrayContaining(["contentType", "size"]));
	});

	it("filename com mais de 255 caracteres responde 400", async () => {
		const response = await seller.client
			.post(ROUTE)
			.send({ ...VALID_BODY, filename: `${"a".repeat(252)}.jpg` });

		expect(response.status).toBe(400);
		expect(response.body.errors[0].field).toBe("filename");
	});

	it("sem login responde 401", async () => {
		const response = await createClient().post(ROUTE).send(VALID_BODY);

		expect(response.status).toBe(401);
	});

	it("cliente responde 403", async () => {
		const response = await customer.client.post(ROUTE).send(VALID_BODY);

		expect(response.status).toBe(403);
	});

	it("sem as variáveis da R2 responde 503 amigável e o resto da API segue funcionando", async () => {
		for (const variable of R2_VARIABLES) {
			useFakeR2();
			delete process.env[variable];

			const response = await seller.client.post(ROUTE).send(VALID_BODY);

			expect(response.status).toBe(503);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/indisponível/);
			expect(JSON.stringify(response.body)).not.toContain(variable);
		}

		const health = await createClient().get("/health");
		expect(health.status).toBe(200);

		const products = await seller.client.get("/vendedor/produtos");
		expect(products.status).toBe(200);
	});

	it("nenhum log traz a chave secreta ou a uploadUrl", async () => {
		const response = await seller.client.post(ROUTE).send(VALID_BODY);
		expect(response.status).toBe(200);

		const logged = JSON.stringify(consoleError.mock.calls);
		expect(logged).not.toContain(FAKE_R2.R2_SECRET_ACCESS_KEY);
		expect(logged).not.toContain(response.body.uploadUrl);
	});

	// Por último: depois do limite, as demais chamadas do mesmo IP também seriam recusadas
	it("acima do limite por minuto responde 429", async () => {
		let response = await seller.client.post(ROUTE).send(VALID_BODY);

		for (let attempt = 0; attempt < 40 && response.status !== 429; attempt++) {
			response = await seller.client.post(ROUTE).send(VALID_BODY);
		}

		expect(response.status).toBe(429);
		expect(response.headers["retry-after"]).toBeDefined();
	});
});
