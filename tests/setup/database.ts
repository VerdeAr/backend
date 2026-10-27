import { afterAll, beforeAll } from "vitest";
import { AppDataSource } from "@/config/database";

// Cada arquivo de teste abre e fecha a sua própria conexão com o banco
beforeAll(async () => {
	if (!AppDataSource.isInitialized) {
		await AppDataSource.initialize();
	}
});

afterAll(async () => {
	if (AppDataSource.isInitialized) {
		await AppDataSource.destroy();
	}
});
