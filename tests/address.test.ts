import { cpf } from "cpf-cnpj-validator";
import { describe, expect, it } from "vitest";
import {
	extractStructuredAddress,
	formatFullAddress,
	optionalStateSchema,
	optionalZipCodeSchema,
	stateSchema,
	structuredAddressInputSchema,
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

		it("extrai alias cep e prioridade de neighborhood_name > neighborhood > bairro", () => {
			// neighborhood_name vence neighborhood e bairro
			const ext1 = extractStructuredAddress({
				neighborhood_name: "Bairro Oficial",
				neighborhood: "Bairro Secundario",
				bairro: "Bairro Terciario",
			});
			expect(ext1.neighborhood_name).toBe("Bairro Oficial");

			// neighborhood vence bairro
			const ext2 = extractStructuredAddress({
				neighborhood: "Bairro Frontend",
				bairro: "Bairro Legado",
			});
			expect(ext2.neighborhood_name).toBe("Bairro Frontend");

			// fallback para bairro legado
			const ext3 = extractStructuredAddress({
				bairro: "Bairro Apenas Legado",
			});
			expect(ext3.neighborhood_name).toBe("Bairro Apenas Legado");
		});
	});

	describe("validação do campo neighborhood", () => {
		it("aceita neighborhood válido e normaliza string vazia para undefined", () => {
			const parsed = structuredAddressInputSchema.parse({
				neighborhood: "Centro",
			});
			expect(parsed.neighborhood).toBe("Centro");

			const parsedEmpty = structuredAddressInputSchema.parse({
				neighborhood: "   ",
			});
			expect(parsedEmpty.neighborhood).toBeUndefined();
		});

		it("aceita neighborhood como null para limpar o valor", () => {
			const parsed = structuredAddressInputSchema.parse({
				neighborhood: null,
			});
			expect(parsed.neighborhood).toBeNull();
		});

		it("rejeita neighborhood com mais de 100 caracteres", () => {
			const longNeighborhood = "A".repeat(101);
			expect(() =>
				structuredAddressInputSchema.parse({
					neighborhood: longNeighborhood,
				}),
			).toThrow();
		});
	});

	describe("função formatFullAddress", () => {
		it("monta o endereço legível a partir de todos os campos estruturados", () => {
			const formatted = formatFullAddress({
				street: "Rua das Palmeiras",
				number: "450",
				complement: "Bloco B",
				neighborhood_name: "Centro",
				city: "Cornélio Procópio",
				state: "PR",
				zip_code: "86300000",
			});

			expect(formatted).toBe(
				"Rua das Palmeiras, 450, Bloco B - Centro - Cornélio Procópio - PR - CEP: 86300-000",
			);
		});

		it("faz fallback para address legado quando não houver campos estruturados", () => {
			const formatted = formatFullAddress({
				address: "Endereço em texto livre legado 123",
			});

			expect(formatted).toBe("Endereço em texto livre legado 123");
		});

		it("retorna null quando não houver nenhum dado de endereço", () => {
			expect(formatFullAddress(null)).toBeNull();
			expect(formatFullAddress({})).toBeNull();
		});
	});

	describe("integração com registerSchema e updateProfileSchema", () => {
		it("valida payload de cadastro com endereço estruturado e CPF válido", () => {
			const validCpf = cpf.generate();
			const parsed = registerSchema.safeParse({
				name: "João Silva",
				email: "joao@exemplo.com",
				password: "senhaSegura123",
				cpf: validCpf,
				cep: "86300-000",
				street: "Rua Alberto",
				number: "100",
				neighborhood: "Centro",
				city: "Cornélio Procópio",
				state: "PR",
			});

			expect(parsed.success).toBe(true);
			if (parsed.success) {
				expect(parsed.data.cep).toBe("86300000");
				expect(parsed.data.state).toBe("PR");
				expect(parsed.data.neighborhood).toBe("Centro");
			}

			expect(registerSchema.shape).toHaveProperty("zip_code");
			expect(registerSchema.shape).toHaveProperty("cep");
			expect(registerSchema.shape).toHaveProperty("street");
			expect(registerSchema.shape).toHaveProperty("number");
			expect(registerSchema.shape).toHaveProperty("complement");
			expect(registerSchema.shape).toHaveProperty("neighborhood_name");
			expect(registerSchema.shape).toHaveProperty("neighborhood");
			expect(registerSchema.shape).toHaveProperty("city");
			expect(registerSchema.shape).toHaveProperty("state");
		});

		it("valida payload de updateProfileSchema com neighborhood e normaliza CEP", () => {
			const parsed = updateProfileSchema.parse({
				cep: "86300-000",
				street: "Rua Marechal Deodoro",
				number: "320",
				complement: "Sala 2",
				neighborhood: "Centro",
				city: "Curitiba",
				state: "pr",
			});

			expect(parsed.cep).toBe("86300000");
			expect(parsed.state).toBe("PR");
			expect(parsed.street).toBe("Rua Marechal Deodoro");
			expect(parsed.number).toBe("320");
			expect(parsed.complement).toBe("Sala 2");
			expect(parsed.neighborhood).toBe("Centro");
			expect(parsed.city).toBe("Curitiba");
		});
	});
});
