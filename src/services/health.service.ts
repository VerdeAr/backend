import { AppDataSource } from "@/config/database";

export class HealthService {
	/**
	 * Verifica se a conexão com o banco está inicializada e respondendo.
	 */
	async isDatabaseUp(): Promise<boolean> {
		if (!AppDataSource.isInitialized) {
			return false;
		}

		try {
			await AppDataSource.query("SELECT 1");
			return true;
		} catch (error) {
			console.error("Falha na verificação de saúde do banco de dados:", error);
			return false;
		}
	}
}

export const healthService = new HealthService();
