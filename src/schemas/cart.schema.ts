import { z } from "zod";
import { DeliveryType } from "@/entities/enums";

export const addCartItemSchema = z.object({
	product_id: z.string().uuid("ID de produto inválido"),
	quantity: z
		.number()
		.positive("Quantidade deve ser maior que zero")
		.default(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemQuantitySchema = z.object({
	quantity: z.number().positive("Quantidade deve ser maior que zero"),
});

export type UpdateCartItemQuantityInput = z.infer<
	typeof updateCartItemQuantitySchema
>;

export const setDeliveryTypeSchema = z.object({
	delivery_type: z.nativeEnum(DeliveryType, {
		message: "Tipo de entrega deve ser ENTREGA ou RETIRADA",
	}),
});

export type SetDeliveryTypeInput = z.infer<typeof setDeliveryTypeSchema>;

export const setPaymentMethodSchema = z.object({
	payment_method: z
		.string()
		.min(1, "Forma de pagamento é obrigatória")
		.max(100, "Nome da forma de pagamento muito longo"),
});

export type SetPaymentMethodInput = z.infer<typeof setPaymentMethodSchema>;

export const cartItemIdParamSchema = z.object({
	id: z.string().uuid("ID de item do carrinho inválido"),
});

export type CartItemIdParam = z.infer<typeof cartItemIdParamSchema>;
