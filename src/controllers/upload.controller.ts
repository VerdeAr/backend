import type { NextFunction, Request, Response } from "express";
import type { PresignedUrlInput } from "@/schemas/upload.schema";
import { storageService } from "@/services/storage.service";

export class UploadController {
	/**
	 * POST /upload/presigned-url
	 * Devolve a URL assinada (PUT, 5 minutos) para o navegador enviar a foto direto à R2
	 * e a URL pública final, que o front grava no `image_url` do produto.
	 */
	async createPresignedUrl(req: Request, res: Response, next: NextFunction) {
		try {
			const { contentType, size } = req.body as PresignedUrlInput;
			const result = await storageService.createProductImageUpload({
				userId: req.user!.id,
				contentType,
				size,
			});
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}
