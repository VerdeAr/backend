import { AppDataSource } from "@/config/database";
import { Review } from "@/entities/Review";
import { SaleProduct } from "@/entities/SaleProduct";

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

	// Usada para impedir duplicidade de avaliação por venda (RN-36)
	findBySaleId(saleId: string): Promise<Review | null> {
		return this.findOne({ where: { sale_id: saleId } });
	},

	findBySellerId(sellerId: string): Promise<Review[]> {
		return this.createQueryBuilder("review")
			.innerJoin("review.sale", "sale")
			.leftJoinAndSelect("review.customer", "customer")
			.where((qb) => {
				const subQuery = qb
					.subQuery()
					.select("item.sale_id")
					.from(SaleProduct, "item")
					.innerJoin("item.product", "product")
					.where("product.seller_id = :sellerId")
					.getQuery();
				return `sale.id IN ${subQuery}`;
			})
			.setParameter("sellerId", sellerId)
			.orderBy("review.created_at", "DESC")
			.getMany();
	},

	findByProductId(productId: string): Promise<Review[]> {
		return this.createQueryBuilder("review")
			.innerJoin("review.sale", "sale")
			.leftJoinAndSelect("review.customer", "customer")
			.where((qb) => {
				const subQuery = qb
					.subQuery()
					.select("item.sale_id")
					.from(SaleProduct, "item")
					.where("item.product_id = :productId")
					.getQuery();
				return `sale.id IN ${subQuery}`;
			})
			.setParameter("productId", productId)
			.orderBy("review.created_at", "DESC")
			.getMany();
	},
});
