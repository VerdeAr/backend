import { AppDataSource } from "@/config/database";
import { SaleStatus } from "@/entities/enums";
import { Sale } from "@/entities/Sale";

export const saleRepository = AppDataSource.getRepository(Sale).extend({
	async findByIdWithDetails(saleId: string): Promise<Sale | null> {
		return this.createQueryBuilder("sale")
			.leftJoinAndSelect("sale.customer", "customer")
			.leftJoinAndSelect("customer.neighborhood", "neighborhood")
			.leftJoinAndSelect("sale.items", "items")
			.leftJoinAndSelect("items.product", "product")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "seller_user")
			.addSelect(["seller_user.id", "seller_user.name", "seller_user.phone"])
			.leftJoinAndSelect("sale.payments", "payments")
			.leftJoinAndSelect("payments.payment_method", "payment_method")
			.where("sale.id = :saleId", { saleId })
			.getOne();
	},

	async findByCustomerId(customerId: string): Promise<Sale[]> {
		return this.createQueryBuilder("sale")
			.leftJoinAndSelect("sale.items", "items")
			.leftJoinAndSelect("items.product", "product")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "seller_user")
			.addSelect(["seller_user.id", "seller_user.name", "seller_user.phone"])
			.leftJoinAndSelect("sale.payments", "payments")
			.leftJoinAndSelect("payments.payment_method", "payment_method")
			.where("sale.customer_id = :customerId", { customerId })
			.orderBy("sale.created_at", "DESC")
			.getMany();
	},

	async findBySellerId(sellerId: string, status?: SaleStatus): Promise<Sale[]> {
		const qb = this.createQueryBuilder("sale")
			.innerJoin("sale.items", "filter_item")
			.innerJoin(
				"filter_item.product",
				"filter_product",
				"filter_product.seller_id = :sellerId",
				{ sellerId },
			)
			.leftJoinAndSelect("sale.customer", "customer")
			.leftJoinAndSelect("customer.neighborhood", "neighborhood")
			.leftJoinAndSelect("sale.items", "items")
			.leftJoinAndSelect("items.product", "product")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("sale.payments", "payments")
			.leftJoinAndSelect("payments.payment_method", "payment_method");

		if (status) {
			qb.andWhere("sale.status = :status", { status });
		}

		return qb.orderBy("sale.created_at", "DESC").getMany();
	},

	async countPendingBySellerId(sellerId: string): Promise<number> {
		const result = await this.createQueryBuilder("sale")
			.innerJoin("sale.items", "item")
			.innerJoin("item.product", "product", "product.seller_id = :sellerId", {
				sellerId,
			})
			.where("sale.status = :status", { status: SaleStatus.ABERTA })
			.select("COUNT(DISTINCT sale.id)", "count")
			.getRawOne();

		return Number(result?.count || 0);
	},
});
