import { AppDataSource } from "@/config/database";
import { Review } from "@/entities/Review";

export interface ProductRatingStats {
	average_rating: number;
	review_count: number;
}

export const reviewRepository = AppDataSource.getRepository(Review).extend({
	async getProductRatingStats(productId: string): Promise<ProductRatingStats> {
		const result = await this.createQueryBuilder("review")
			.innerJoin("review.sale", "sale")
			.innerJoin("sale.items", "item", "item.product_id = :productId", {
				productId,
			})
			.select("AVG(review.rating)", "average")
			.addSelect("COUNT(DISTINCT review.id)", "count")
			.getRawOne();

		return {
			average_rating: result?.average
				? Number(Number(result.average).toFixed(1))
				: 0,
			review_count: Number(result?.count || 0),
		};
	},
});
