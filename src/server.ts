import process from "node:process";
import { app } from "@/app.js";
import { AppDataSource } from "@/config/database.js";

const PORT = Number(process.env.PORT);

AppDataSource.initialize()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`Servidor rodando em: http://localhost:${PORT}`);
			console.log(`Documentação Swagger em: http://localhost:${PORT}/docs`);
		});
	})
	.catch((err) => {
		console.error("Erro ao conectar no banco de dados:", err);
	});
