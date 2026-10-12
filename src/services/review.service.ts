import { AppDataSource } from "@/config/database";
import { SaleStatus } from "@/entities/enums";
import type { Review } from "@/entities/Review";
import { Sale } from "@/entities/Sale";
import { AppError } from "@/errors/AppError";
import { reviewRepository } from "@/repositories";
import type { CreateReviewInput } from "@/schemas/review.schema";

export interface FormattedReview {
	id: string;
	rating: number;
	comment: string | null;
	created_at: Date;
	customer: {
		id: string;
		name: string;
	};
}

export class ReviewService {
	/**
	 * Cria uma avaliação para uma venda do cliente autenticado.
	 * Regras de negócio (RN-35 a RN-37): a venda deve pertencer ao cliente,
	 * estar com status FINALIZADA e não possuir avaliação anterior.
	 */
	async createReview(
		customerId: string,
		data: CreateReviewInput,
	): Promise<Review> {
		const sale = await AppDataSource.getRepository(Sale).findOne({
			where: { id: data.sale_id },
		});

		if (!sale || sale.customer_id !== customerId) {
			throw new AppError("Venda não encontrada.", 404);
		}

		if (sale.status !== SaleStatus.FINALIZADA) {
			throw new AppError(
				"Só é possível avaliar vendas com status finalizada.",
				400,
			);
		}

		const existingReview = await reviewRepository.findBySaleId(sale.id);
		if (existingReview) {
			throw new AppError("Esta venda já possui uma avaliação registrada.", 400);
		}

		const review = reviewRepository.create({
			sale_id: sale.id,
			customer_id: customerId,
			rating: data.rating,
			comment: data.comment ?? null,
		});

		return reviewRepository.save(review);
	}

	/**
	 * Lista as avaliações recebidas pelos produtos de um vendedor.
	 */
	async getReviewsBySeller(sellerId: string): Promise<FormattedReview[]> {
		const reviews = await reviewRepository.findBySellerId(sellerId);
		return reviews.map((review) => this.formatReview(review));
	}

	/**
	 * Lista as avaliações recebidas por um produto específico.
	 */
	async getReviewsByProduct(productId: string): Promise<FormattedReview[]> {
		const reviews = await reviewRepository.findByProductId(productId);
		return reviews.map((review) => this.formatReview(review));
	}

	private formatReview(review: Review): FormattedReview {
		return {
			id: review.id,
			rating: review.rating,
			comment: review.comment,
			created_at: review.created_at,
			customer: {
				id: review.customer.id,
				name: review.customer.name,
			},
		};
	}
}

export const reviewService = new ReviewService();
