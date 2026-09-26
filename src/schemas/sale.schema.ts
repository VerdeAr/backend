import { z } from "zod";
import { DeliveryType, SaleStatus } from "@/entities/enums";

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

export const sellerOrdersQuerySchema = z.object({
	status: z.nativeEnum(SaleStatus).optional(),
});

export type SellerOrdersQuery = z.infer<typeof sellerOrdersQuerySchema>;

export const saleIdParamSchema = z.object({
	id: z.string().uuid("ID de venda inválido"),
});

export type SaleIdParam = z.infer<typeof saleIdParamSchema>;

export const updateSaleStatusSchema = z.object({
	status: z.nativeEnum(SaleStatus, {
		message: "Status deve ser ABERTA, FINALIZADA ou CANCELADA",
	}),
});

export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;
