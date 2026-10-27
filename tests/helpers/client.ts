import request from "supertest";
import { app } from "@/app";

// O agente mantém os cookies entre as requisições, como um navegador (cookie "token")
export function createClient() {
	return request.agent(app);
}

export type Client = ReturnType<typeof createClient>;
