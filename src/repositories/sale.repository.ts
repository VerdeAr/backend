import { AppDataSource } from "@/config/database";
import type { SaleStatus } from "@/entities/enums";
import { Sale } from "@/entities/Sale";
import { SELLER_PENDING_STATUSES } from "@/services/sale-status";

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
			.leftJoinAndSelect("sale.reviews", "reviews")
			.where("sale.id = :saleId", { saleId })
			.getOne();
	},

	/**
	 * Detalhe do pedido para o vendedor. Seleciona os campos explicitamente para que dados
	 * sensíveis do cliente (senha, CPF etc.) nunca saiam da camada de dados.
	 */
	async findSellerOrderDetail(saleId: string): Promise<Sale | null> {
		return this.createQueryBuilder("sale")
			.select([
				"sale.id",
				"sale.status",
				"sale.delivery_type",
				"sale.total_amount",
				"sale.created_at",
				"sale.updated_at",
			])
			.leftJoin("sale.customer", "customer")
			.addSelect([
				"customer.id",
				"customer.name",
				"customer.email",
				"customer.phone",
				"customer.address",
				// Endereço estruturado (VER-63): sem estes campos o formatFullAddress
				// só enxerga o texto legado e devolve null para cadastros novos.
				"customer.zip_code",
				"customer.street",
				"customer.number",
				"customer.complement",
				"customer.neighborhood_name",
				"customer.city",
				"customer.state",
			])
			.leftJoin("customer.neighborhood", "neighborhood")
			.addSelect(["neighborhood.id", "neighborhood.name"])
			.leftJoin("sale.items", "items")
			.addSelect([
				"items.id",
				"items.product_id",
				"items.quantity",
				"items.unit_price",
			])
			.leftJoin("items.product", "product")
			.addSelect([
				"product.id",
				"product.name",
				"product.image_url",
				"product.seller_id",
			])
			.leftJoin("product.measurement_unit", "measurement_unit")
			.addSelect([
				"measurement_unit.id",
				"measurement_unit.name",
				"measurement_unit.symbol",
			])
			.leftJoin("sale.payments", "payments")
			.addSelect(["payments.id", "payments.amount"])
			.leftJoin("payments.payment_method", "payment_method")
			.addSelect(["payment_method.id", "payment_method.description"])
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
			.leftJoinAndSelect("sale.reviews", "reviews")
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
			.where("sale.status IN (:...statuses)", {
				statuses: SELLER_PENDING_STATUSES,
			})
			.select("COUNT(DISTINCT sale.id)", "count")
			.getRawOne();

		return Number(result?.count || 0);
	},
});
