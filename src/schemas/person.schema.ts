import { z } from "zod";
import { structuredAddressInputSchema } from "./address.schema";
import { updateShippingSettingsSchema } from "./shipping.schema";

const baseUpdateProfileSchema = z.object({
	name: z
		.string()
		.min(2, "Nome deve ter pelo menos 2 caracteres")
		.max(100)
		.optional(),
	phone: z.string().max(20).optional().nullable(),
	address: z.string().max(255).optional().nullable(),
	neighborhood_id: z.uuid("ID de bairro inválido").optional().nullable(),

	// Campos adicionais caso seja Vendedor
	description: z.string().max(500).optional().nullable(),
	farm_name: z.string().max(150).optional().nullable(),
});

export const updateProfileSchema = baseUpdateProfileSchema.extend(
	structuredAddressInputSchema.shape,
);

export const updatePasswordSchema = z
	.object({
		current_password: z.string().min(1, "Senha atual é obrigatória"),
		new_password: z
			.string()
			.min(6, "Nova senha deve ter pelo menos 6 caracteres"),
		confirm_password: z
			.string()
			.min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
	})
	.refine((data) => data.new_password === data.confirm_password, {
		message: "A nova senha e a confirmação de senha não coincidem",
		path: ["confirm_password"],
	});

// PUT /pessoa/frete: aceita a taxa fixa antiga e a configuração do frete por km (VER-91)
export const updateShippingRateSchema = updateShippingSettingsSchema;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateShippingRateInput = z.infer<typeof updateShippingRateSchema>;
