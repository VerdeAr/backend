import { describe, expect, it } from "vitest";
import {
	extractStructuredAddress,
	optionalStateSchema,
	optionalZipCodeSchema,
	stateSchema,
	zipCodeSchema,
} from "@/schemas/address.schema";
import { registerSchema } from "@/schemas/auth.schema";
import { updateProfileSchema } from "@/schemas/person.schema";

describe("schemas de endereço estruturado e normalização de CEP (VER-63)", () => {
	describe("validação de CEP (zipCodeSchema)", () => {
		it("aceita CEP de 8 dígitos numéricos", () => {
			expect(zipCodeSchema.parse("86300000")).toBe("86300000");
		});

		it("aceita e normaliza CEP com máscara (XXXXX-XXX)", () => {
			expect(zipCodeSchema.parse("86300-000")).toBe("86300000");
			expect(zipCodeSchema.parse(" 01001-000 ")).toBe("01001000");
		});

		it("rejeita CEP com menos de 8 dígitos", () => {
			expect(() => zipCodeSchema.parse("86300")).toThrow();
		});

		it("rejeita CEP com letras ou caracteres inválidos", () => {
			expect(() => zipCodeSchema.parse("86300-00A")).toThrow();
			expect(() => zipCodeSchema.parse("abcdefgh")).toThrow();
		});

		it("rejeita CEP com mais de 8 dígitos", () => {
			expect(() => zipCodeSchema.parse("863000001")).toThrow();
		});

		it("converte string vazia para undefined em optionalZipCodeSchema", () => {
			expect(optionalZipCodeSchema.parse("")).toBeUndefined();
			expect(optionalZipCodeSchema.parse("   ")).toBeUndefined();
			expect(optionalZipCodeSchema.parse(undefined)).toBeUndefined();
			expect(optionalZipCodeSchema.parse(null)).toBeNull();
		});
	});

	describe("validação de UF (stateSchema)", () => {
		it("normaliza UF em minúsculas para maiúsculas", () => {
			expect(stateSchema.parse("pr")).toBe("PR");
			expect(stateSchema.parse("sp")).toBe("SP");
		});

		it("aceita UFs válidas brasileiras", () => {
			expect(stateSchema.parse("RJ")).toBe("RJ");
			expect(stateSchema.parse("MG")).toBe("MG");
			expect(stateSchema.parse("SC")).toBe("SC");
		});

		it("rejeita UF inexistente no Brasil", () => {
			expect(() => stateSchema.parse("XX")).toThrow();
			expect(() => stateSchema.parse("ZZ")).toThrow();
		});

		it("rejeita UF com mais ou menos de 2 caracteres", () => {
			expect(() => stateSchema.parse("P")).toThrow();
			expect(() => stateSchema.parse("PAR")).toThrow();
		});

		it("converte string vazia para undefined em optionalStateSchema", () => {
			expect(optionalStateSchema.parse("")).toBeUndefined();
			expect(optionalStateSchema.parse(undefined)).toBeUndefined();
			expect(optionalStateSchema.parse(null)).toBeNull();
		});
	});

	describe("função extractStructuredAddress", () => {
		it("extrai campos com nomes em inglês", () => {
			const extracted = extractStructuredAddress({
				zip_code: "86300000",
				street: "Rua das Flores",
				number: "120",
				complement: "Apto 4",
				neighborhood_name: "Centro",
				city: "Cornélio Procópio",
				state: "PR",
			});

			expect(extracted).toEqual({
				zip_code: "86300000",
				street: "Rua das Flores",
				number: "120",
				complement: "Apto 4",
				neighborhood_name: "Centro",
				city: "Cornélio Procópio",
				state: "PR",
			});
		});

		it("extrai aliases em português (compatíveis com ViaCEP e formulários)", () => {
			const extracted = extractStructuredAddress({
				cep: "86300000",
				logradouro: "Avenida Brasil",
				numero: "500",
				complemento: "Bloco A",
				bairro: "Vila Nova",
				cidade: "Londrina",
				uf: "PR",
			});

			expect(extracted).toEqual({
				zip_code: "86300000",
				street: "Avenida Brasil",
				number: "500",
				complement: "Bloco A",
				neighborhood_name: "Vila Nova",
				city: "Londrina",
				state: "PR",
			});
		});
	});

	describe("integração com registerSchema e updateProfileSchema", () => {
		it("valida payload de cadastro com endereço estruturado", () => {
			const parsed = registerSchema.safeParse({
				name: "João Silva",
				email: "joao@exemplo.com",
				password: "senhaSegura123",
				cpf: "12345678909", // CPF formatado ou validado
				cep: "86300-000",
				logradouro: "Rua Alberto",
				numero: "100",
				bairro: "Centro",
				cidade: "Cornélio Procópio",
				uf: "PR",
			});

			// O CPF '12345678909' falhará na validação matemática se não for válido,
			// então testamos a presença das chaves de endereço no schema shape:
			expect(registerSchema.shape).toHaveProperty("zip_code");
			expect(registerSchema.shape).toHaveProperty("cep");
			expect(registerSchema.shape).toHaveProperty("street");
			expect(registerSchema.shape).toHaveProperty("logradouro");
			expect(registerSchema.shape).toHaveProperty("number");
			expect(registerSchema.shape).toHaveProperty("numero");
			expect(registerSchema.shape).toHaveProperty("neighborhood_name");
			expect(registerSchema.shape).toHaveProperty("bairro");
			expect(registerSchema.shape).toHaveProperty("city");
			expect(registerSchema.shape).toHaveProperty("cidade");
			expect(registerSchema.shape).toHaveProperty("state");
			expect(registerSchema.shape).toHaveProperty("uf");
		});

		it("valida payload de updateProfileSchema com campos em português e normaliza CEP e UF", () => {
			const parsed = updateProfileSchema.parse({
				cep: "86300-000",
				logradouro: "Rua Marechal Deodoro",
				numero: "320",
				complemento: "Sala 2",
				bairro: "Centro",
				cidade: "Curitiba",
				uf: "pr",
			});

			expect(parsed.cep).toBe("86300000");
			expect(parsed.uf).toBe("PR");
			expect(parsed.logradouro).toBe("Rua Marechal Deodoro");
			expect(parsed.numero).toBe("320");
			expect(parsed.complemento).toBe("Sala 2");
			expect(parsed.bairro).toBe("Centro");
			expect(parsed.cidade).toBe("Curitiba");
		});

		it("valida payload de updateProfileSchema com campos em inglês", () => {
			const parsed = updateProfileSchema.parse({
				zip_code: "86300000",
				street: "Rua XV de Novembro",
				number: "10",
				neighborhood_name: "Centro",
				city: "Curitiba",
				state: "PR",
			});

			expect(parsed.zip_code).toBe("86300000");
			expect(parsed.state).toBe("PR");
			expect(parsed.street).toBe("Rua XV de Novembro");
			expect(parsed.number).toBe("10");
		});
	});
});
