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
	status: z.preprocess(
		(val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
		z.nativeEnum(SaleStatus).optional(),
	),
});

export type SellerOrdersQuery = z.infer<typeof sellerOrdersQuerySchema>;

export const saleIdParamSchema = z.object({
	id: z.string().uuid("ID de venda inválido"),
});

export type SaleIdParam = z.infer<typeof saleIdParamSchema>;

export const updateSaleStatusSchema = z.object({
	status: z.nativeEnum(SaleStatus, {
		message:
			"Status deve ser ABERTA, EM_PREPARACAO, A_CAMINHO, AGUARDANDO_APROVACAO_CLIENTE, FINALIZADA ou CANCELADA",
	}),
});

export type UpdateSaleStatusInput = z.infer<typeof updateSaleStatusSchema>;

// Quantidades são numeric(10,3): até 3 casas decimais (ex.: 1,850 kg)
const hasAtMostThreeDecimals = (value: number) =>
	Math.abs(Math.round(value * 1000) - value * 1000) < 1e-6;

export const proposeAdjustmentSchema = z.object({
	reason: z
		.string({ message: "Motivo do ajuste é obrigatório" })
		.trim()
		.min(1, "Motivo do ajuste é obrigatório")
		.max(500, "Motivo do ajuste deve ter no máximo 500 caracteres"),
	items: z
		.array(
			z.object({
				sale_product_id: z.string().uuid("ID de item do pedido inválido"),
				quantity: z
					.number({ message: "Quantidade deve ser um número" })
					.positive("Quantidade deve ser maior que zero")
					.max(9_999_999.999, "Quantidade muito alta")
					.refine(hasAtMostThreeDecimals, {
						message: "Quantidade aceita no máximo 3 casas decimais",
					}),
			}),
			{ message: "Informe os itens do ajuste" },
		)
		.min(1, "Informe ao menos um item para ajustar")
		.refine(
			(items) =>
				new Set(items.map((item) => item.sale_product_id)).size ===
				items.length,
			{ message: "Cada item do pedido só pode aparecer uma vez no ajuste" },
		),
});

export type ProposeAdjustmentInput = z.infer<typeof proposeAdjustmentSchema>;

export const respondAdjustmentSchema = z.object({
	aceitar: z.boolean({
		message: "Informe se aceita o ajuste (aceitar: true ou false)",
	}),
});

export type RespondAdjustmentInput = z.infer<typeof respondAdjustmentSchema>;
