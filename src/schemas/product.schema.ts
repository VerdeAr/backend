import { z } from "zod";

const emptyStringToUndefinedUuid = z.preprocess(
	(val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
	z.string().uuid("ID inválido").optional(),
);

const emptyStringToUndefinedString = z.preprocess(
	(val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
	z.string().optional(),
);

export const productFilterQuerySchema = z.object({
	categoria: emptyStringToUndefinedUuid,
	categoriaId: emptyStringToUndefinedUuid,
	category_id: emptyStringToUndefinedUuid,
	vendedorId: emptyStringToUndefinedUuid,
	seller_id: emptyStringToUndefinedUuid,
	termo: emptyStringToUndefinedString,
	search: emptyStringToUndefinedString,
	q: emptyStringToUndefinedString,
	disponivel: z
		.union([z.boolean(), z.enum(["true", "false", "1", "0"])])
		.optional()
		.transform((val) => {
			if (val === undefined) return true;
			return val === true || val === "true" || val === "1";
		}),
	pagina: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (!val) return undefined;
			const parsed = Number(val);
			return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
		}),
	page: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (!val) return undefined;
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

export const createProductSchema = z.object({
	name: z
		.string()
		.min(2, "Nome deve ter no mínimo 2 caracteres")
		.max(255, "Nome muito longo"),
	price: z.number().positive("Preço deve ser maior que zero"),
	stock: z.number().min(0, "Estoque não pode ser negativo"),
	category_id: z
		.string()
		.uuid("ID de categoria inválido")
		.optional()
		.nullable(),
	measurement_unit_id: z
		.string()
		.uuid("ID de unidade de medida inválido")
		.optional()
		.nullable(),
	description: z
		.string()
		.max(2000, "Descrição muito longa")
		.optional()
		.nullable(),
	image_url: z.string().url("URL de imagem inválida").optional().nullable(),
	is_active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
