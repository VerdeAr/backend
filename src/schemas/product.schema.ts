import { z } from "zod";

export const productFilterQuerySchema = z.object({
	categoriaId: z.string().uuid("ID de categoria inválido").optional(),
	category_id: z.string().uuid("ID de categoria inválido").optional(),
	vendedorId: z.string().uuid("ID de vendedor inválido").optional(),
	seller_id: z.string().uuid("ID de vendedor inválido").optional(),
	termo: z.string().optional(),
	search: z.string().optional(),
	q: z.string().optional(),
	disponivel: z
		.union([z.boolean(), z.enum(["true", "false", "1", "0"])])
		.optional()
		.transform((val) => {
			if (val === undefined) return true;
			return val === true || val === "true" || val === "1";
		}),
	page: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (!val) return 1;
			const parsed = Number(val);
			return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
		}),
	limit: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (!val) return 12;
			const parsed = Number(val);
			return Number.isNaN(parsed) || parsed < 1 ? 12 : parsed;
		}),
	orderBy: z.enum(["name", "price", "created_at"]).optional(),
	orderDir: z
		.enum(["ASC", "DESC", "asc", "desc"])
		.optional()
		.transform((val) => (val ? (val.toUpperCase() as "ASC" | "DESC") : "DESC")),
});

export type ProductFilterQuery = z.infer<typeof productFilterQuerySchema>;

export const productIdParamSchema = z.object({
	id: z.string().uuid("ID de produto inválido"),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
