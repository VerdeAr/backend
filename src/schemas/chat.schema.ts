import { z } from "zod";

export const iniciarChatSchema = z
	.object({
		seller_id: z.string().uuid("ID de vendedor inválido").optional(),
		product_id: z.string().uuid("ID de produto inválido").optional(),
		sale_id: z.string().uuid("ID de venda inválido").optional(),
	})
	.refine(
		(data) => Boolean(data.seller_id || data.product_id || data.sale_id),
		{
			message: "Informe seller_id, product_id ou sale_id para iniciar o chat.",
		},
	);

export type IniciarChatInput = z.infer<typeof iniciarChatSchema>;

export const sendMessageSchema = z.object({
	content: z
		.string()
		.min(1, "O conteúdo da mensagem não pode ser vazio.")
		.max(2000, "A mensagem não pode exceder 2000 caracteres."),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const chatIdParamSchema = z.object({
	id: z.string().uuid("ID de chat inválido."),
});

export type ChatIdParam = z.infer<typeof chatIdParamSchema>;

export const listMessagesQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
