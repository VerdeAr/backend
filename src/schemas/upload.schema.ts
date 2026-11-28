import { z } from "zod";
import {
	ALLOWED_IMAGE_TYPES,
	type AllowedImageType,
	MAX_IMAGE_SIZE_BYTES,
} from "@/services/storage.service";

const allowedTypes = Object.keys(ALLOWED_IMAGE_TYPES) as [
	AllowedImageType,
	...AllowedImageType[],
];

// POST /upload/presigned-url: pedido de URL assinada para a foto do produto
export const presignedUrlSchema = z.object({
	contentType: z.enum(allowedTypes, {
		error: "Tipo de imagem não permitido. Use JPEG, PNG ou WEBP.",
	}),
	size: z
		.number("Tamanho deve ser um número (em bytes)")
		.int("Tamanho deve ser um número inteiro de bytes")
		.positive("Tamanho deve ser maior que zero")
		.max(MAX_IMAGE_SIZE_BYTES, "A imagem deve ter no máximo 5 MB"),
	// Só informativo: nunca é usado no nome do arquivo no bucket
	filename: z
		.string("Nome do arquivo deve ser um texto")
		.max(255, "Nome do arquivo deve ter no máximo 255 caracteres")
		.optional(),
});

export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>;
