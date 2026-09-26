import { AppDataSource } from "@/config/database";
import { Product } from "@/entities/Product";

export interface ProductFilterOptions {
	categoryId?: string;
	sellerId?: string;
	search?: string;
	availableOnly?: boolean;
	page?: number;
	limit?: number;
	orderBy?: "name" | "price" | "created_at";
	orderDir?: "ASC" | "DESC";
}

export interface PaginatedProducts {
	data: Product[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const productRepository = AppDataSource.getRepository(Product).extend({
	async findFiltered(
		options: ProductFilterOptions = {},
	): Promise<PaginatedProducts> {
		const page = options.page && options.page > 0 ? options.page : 1;
		const limit = options.limit && options.limit > 0 ? options.limit : 12;
		const orderBy = options.orderBy || "created_at";
		const orderDir = options.orderDir || "DESC";

		const qb = this.createQueryBuilder("product")
			.leftJoinAndSelect("product.category", "category")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "user")
			.addSelect([
				"user.id",
				"user.name",
				"user.email",
				"user.phone",
				"user.fixed_shipping_rate",
			]);

		if (options.availableOnly) {
			qb.andWhere("product.is_active = :isActive", { isActive: true }).andWhere(
				"product.stock > 0",
			);
		}

		if (options.categoryId) {
			qb.andWhere("product.category_id = :categoryId", {
				categoryId: options.categoryId,
			});
		}

		if (options.sellerId) {
			qb.andWhere("product.seller_id = :sellerId", {
				sellerId: options.sellerId,
			});
		}

		if (options.search && options.search.trim() !== "") {
			qb.andWhere(
				"(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))",
				{ search: `%${options.search.trim()}%` },
			);
		}

		qb.orderBy(`product.${orderBy}`, orderDir)
			.skip((page - 1) * limit)
			.take(limit);

		const [data, total] = await qb.getManyAndCount();
		const totalPages = Math.ceil(total / limit) || 1;

		return {
			data,
			total,
			page,
			limit,
			totalPages,
		};
	},

	async findByIdWithDetails(id: string): Promise<Product | null> {
		return this.createQueryBuilder("product")
			.leftJoinAndSelect("product.category", "category")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "user")
			.addSelect([
				"user.id",
				"user.name",
				"user.email",
				"user.phone",
				"user.fixed_shipping_rate",
			])
			.where("product.id = :id", { id })
			.getOne();
	},

	async findBySeller(sellerId: string): Promise<Product[]> {
		return this.createQueryBuilder("product")
			.leftJoinAndSelect("product.category", "category")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.where("product.seller_id = :sellerId", { sellerId })
			.orderBy("product.created_at", "DESC")
			.getMany();
	},
});
