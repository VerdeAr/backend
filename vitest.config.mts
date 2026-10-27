import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		// Os testes de integração compartilham o mesmo banco, então rodam em sequência
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 60_000,
	},
});
