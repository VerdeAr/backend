import { AppDataSource } from "@/config/database";
import { Sale } from "@/entities/Sale";

export const saleRepository = AppDataSource.getRepository(Sale).extend({
	async findByIdWithDetails(saleId: string): Promise<Sale | null> {
		return this.createQueryBuilder("sale")
			.leftJoinAndSelect("sale.customer", "customer")
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
});
