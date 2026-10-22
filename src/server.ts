import http from "node:http";
import process from "node:process";
import { app } from "@/app.js";
import { AppDataSource } from "@/config/database.js";
import { initSocketServer } from "@/websocket/socket.server.js";

const PORT = Number(process.env.PORT) || 3000;
const httpServer = http.createServer(app);
initSocketServer(httpServer);

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
	});
