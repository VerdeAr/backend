import process from "node:process";
import { Router } from "express";
import { UploadController } from "@/controllers/upload.controller";
import { UserRole } from "@/entities/enums";
import { ensureAuthenticated, ensureRole } from "@/middlewares/auth.middleware";
import { cacheControl } from "@/middlewares/cache.middleware";
import { rateLimit } from "@/middlewares/rate-limit.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { presignedUrlSchema } from "@/schemas/upload.schema";

const uploadRoutes = Router();
const controller = new UploadController();

// Só VENDEDOR pede URL de upload (foto do produto), com limite por IP
uploadRoutes.post(
	"/presigned-url",
	ensureAuthenticated,
	ensureRole([UserRole.VENDEDOR]),
	rateLimit({
		windowMs: 60_000,
		max: Number(process.env.UPLOAD_RATE_LIMIT) || 30,
		message:
			"Muitos pedidos de envio de imagem em pouco tempo. Aguarde um minuto e tente novamente.",
	}),
	cacheControl("no-store"),
	validate(presignedUrlSchema),
	controller.createPresignedUrl,
);

export { uploadRoutes };
