import { describe, expect, it } from "vitest";
import { AppError } from "@/errors/AppError";

describe("infraestrutura de testes", () => {
	it("resolve o alias @ para a pasta src", () => {
		const error = new AppError("falha de teste", 409);

		expect(error.message).toBe("falha de teste");
		expect(error.statusCode).toBe(409);
	});
});
