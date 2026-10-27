import http from "node:http";
import process from "node:process";
import { app } from "@/app.js";
import { AppDataSource } from "@/config/database.js";
import { initSocketServer } from "@/websocket/socket.server.js";

const PORT = Number(process.env.PORT) || 3000;
const httpServer = http.createServer(app);
initSocketServer(httpServer);

// Sem PORT definida a API usa 3000; uma porta configurada de forma inválida (negativa ou
// fracionada) falha cedo, em vez de escutar em uma porta inesperada
if (!Number.isInteger(PORT) || PORT <= 0) {
	console.error(
		"Variável de ambiente PORT inválida. Defina um número inteiro positivo.",
	);
	process.exit(1);
}

AppDataSource.initialize()
	.then(() => {
		httpServer.listen(PORT, () => {
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
