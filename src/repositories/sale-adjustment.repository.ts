import { AppDataSource } from "@/config/database";
import { SaleAdjustmentStatus } from "@/entities/enums";
import { SaleAdjustment } from "@/entities/SaleAdjustment";

export const saleAdjustmentRepository = AppDataSource.getRepository(
	SaleAdjustment,
).extend({
	// Proposta pendente do pedido (no máximo uma, garantida por índice único parcial)
	async findPendingBySaleId(saleId: string): Promise<SaleAdjustment | null> {
		const [adjustment] = await this.findPendingBySaleIds([saleId]);
		return adjustment ?? null;
	},

	// Propostas pendentes de vários pedidos em uma única consulta (histórico do cliente)
	async findPendingBySaleIds(saleIds: string[]): Promise<SaleAdjustment[]> {
		if (saleIds.length === 0) {
			return [];
		}

		return this.createQueryBuilder("adjustment")
			.leftJoinAndSelect("adjustment.items", "items")
			.leftJoin("items.sale_product", "sale_product")
			.addSelect(["sale_product.id", "sale_product.product_id"])
			.leftJoin("sale_product.product", "product")
			.addSelect(["product.id", "product.name"])
			.where("adjustment.sale_id IN (:...saleIds)", { saleIds })
			.andWhere("adjustment.status = :status", {
				status: SaleAdjustmentStatus.PENDENTE,
			})
			.getMany();
	},
});
