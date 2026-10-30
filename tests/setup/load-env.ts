import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

// Variáveis já definidas no ambiente (ex.: pelo CI) têm prioridade sobre o .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), quiet: true });

// Trava de segurança: os testes criam e alteram dados, então só podem rodar em um banco
// exclusivo de testes, nunca no de homologação ou de produção.
const databaseName = process.env.DB_NAME;

if (!databaseName?.endsWith("_test")) {
	const message =
		`Os testes exigem um banco cujo nome termine em "_test" (DB_NAME atual: "${databaseName ?? "não definido"}"). ` +
		"Copie .env.test.example para .env.test e suba o banco com: docker compose -f docker-compose.test.yml up -d";

	// O Vitest pode mascarar o erro lançado durante o setup, então a mensagem também vai ao console
	console.error(`
${message}
`);
	throw new Error(message);
}
