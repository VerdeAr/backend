import { cnpj as cnpjValidator, cpf as cpfValidator } from "cpf-cnpj-validator";
import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
	email: z.email("Formato de e-mail inválido"),
	password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
	cpf: z
		.string()
		.min(11, "CPF deve conter no mínimo 11 dígitos")
		.refine(
			(val) => cpfValidator.isValid(val.replace(/\D/g, "")),
			"CPF informado é inválido",
		)
		.transform((val) => val.replace(/\D/g, "")),
	role: z.enum(["CLIENTE", "VENDEDOR"]).default("CLIENTE"),
	phone: z.string().max(20).optional().nullable(),
	address: z.string().max(255).optional().nullable(),
	neighborhood_id: z.uuid("ID de bairro inválido").optional().nullable(),

	// Campos específicos para Vendedor Rural
	description: z.string().max(500).optional().nullable(),
	cnpj: z
		.string()
		.optional()
		.nullable()
		.refine(
			(val) => !val || cnpjValidator.isValid(val.replace(/\D/g, "")),
			"CNPJ informado é inválido",
		)
		.transform((val) => (val ? val.replace(/\D/g, "") : null)),
	farm_name: z.string().max(150).optional().nullable(),
});

export const loginSchema = z.object({
	email: z.email("Formato de e-mail inválido"),
	password: z.string().min(1, "Senha é obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
