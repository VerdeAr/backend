import { z } from "zod";
import { DeliveryType } from "@/entities/enums";

export const checkoutSchema = z.object({
	delivery_type: z
		.nativeEnum(DeliveryType, {
			message: "Tipo de entrega deve ser ENTREGA ou RETIRADA",
		})
		.optional(),
	payment_method: z
		.string()
		.min(1, "Forma de pagamento não pode ser vazia")
		.max(100, "Nome da forma de pagamento muito longo")
		.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
