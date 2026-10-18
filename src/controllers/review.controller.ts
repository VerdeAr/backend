import type { NextFunction, Request, Response } from "express";
import {
	createReviewSchema,
	reviewProductIdParamSchema,
	reviewSellerIdParamSchema,
} from "@/schemas/review.schema";
import { reviewService } from "@/services/review.service";

export class ReviewController {
	/**
	 * POST /avaliacoes
	 * Cria uma avaliação para uma venda finalizada do cliente autenticado.
	 */
	async create(req: Request, res: Response, next: NextFunction) {
		try {
			const customerId = req.user!.id;
			const data = createReviewSchema.parse(req.body);
			const review = await reviewService.createReview(customerId, data);
			return res.status(201).json(review);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /avaliacoes/vendedor/:sellerId
	 * Lista as avaliações recebidas pelos produtos de um vendedor.
	 */
	async getBySeller(req: Request, res: Response, next: NextFunction) {
		try {
			const { sellerId } = reviewSellerIdParamSchema.parse(req.params);
			const reviews = await reviewService.getReviewsBySeller(sellerId);
			return res.status(200).json(reviews);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /avaliacoes/produto/:productId
	 * Lista as avaliações recebidas por um produto específico.
	 */
	async getByProduct(req: Request, res: Response, next: NextFunction) {
		try {
			const { productId } = reviewProductIdParamSchema.parse(req.params);
			const reviews = await reviewService.getReviewsByProduct(productId);
			return res.status(200).json(reviews);
		} catch (error) {
			next(error);
		}
	}
}
