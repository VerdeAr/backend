import process from "node:process";
import { app } from "@/app.js";
import { AppDataSource } from "@/config/database.js";

const PORT = Number(process.env.PORT);

// Falha cedo quando a porta não foi configurada, em vez de escutar em uma porta aleatória
if (!Number.isInteger(PORT) || PORT <= 0) {
	console.error(
		"Variável de ambiente PORT ausente ou inválida. Defina um número inteiro positivo.",
	);
	process.exit(1);
}

AppDataSource.initialize()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Servidor rodando em: http://localhost:${PORT}`);
			console.log(
				`Documentação Swagger em: http://localhost:${PORT}/docs ou http://localhost:${PORT}/api-docs`,
			);
		});
	})
	.catch((err) => {
		console.error("Erro ao conectar no banco de dados:", err);
		// Encerra o processo para o orquestrador reiniciar o contêiner e a falha ficar visível
		process.exit(1);
	});
