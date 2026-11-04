import { AppDataSource } from "@/config/database";
import { SaleAdjustmentStatus } from "@/entities/enums";
import { SaleAdjustment } from "@/entities/SaleAdjustment";

export const saleAdjustmentRepository = AppDataSource.getRepository(
	SaleAdjustment,
).extend({
	// Proposta pendente do pedido (no máximo uma, garantida por índice único parcial)
	async findPendingBySaleId(saleId: string): Promise<SaleAdjustment | null> {
		return this.createQueryBuilder("adjustment")
			.leftJoinAndSelect("adjustment.items", "items")
			.leftJoin("items.sale_product", "sale_product")
			.addSelect(["sale_product.id", "sale_product.product_id"])
			.leftJoin("sale_product.product", "product")
			.addSelect(["product.id", "product.name"])
			.where("adjustment.sale_id = :saleId", { saleId })
			.andWhere("adjustment.status = :status", {
				status: SaleAdjustmentStatus.PENDENTE,
			})
			.getOne();
	},
});
