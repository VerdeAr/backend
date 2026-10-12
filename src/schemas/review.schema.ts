import { z } from "zod";

export const createReviewSchema = z.object({
	sale_id: z.string().uuid("ID de venda inválido"),
	rating: z
		.number()
		.int("Nota deve ser um número inteiro")
		.min(1, "Nota deve ser entre 1 e 5")
		.max(5, "Nota deve ser entre 1 e 5"),
	comment: z
		.string()
		.max(500, "Comentário deve ter no máximo 500 caracteres")
		.optional()
		.nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewSellerIdParamSchema = z.object({
	sellerId: z.string().uuid("ID de vendedor inválido"),
});

export type ReviewSellerIdParam = z.infer<typeof reviewSellerIdParamSchema>;

export const reviewProductIdParamSchema = z.object({
	productId: z.string().uuid("ID de produto inválido"),
});

export type ReviewProductIdParam = z.infer<typeof reviewProductIdParamSchema>;
