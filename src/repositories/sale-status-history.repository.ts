import { AppDataSource } from "@/config/database";
import { SaleStatusHistory } from "@/entities/SaleStatusHistory";

export const saleStatusHistoryRepository = AppDataSource.getRepository(
	SaleStatusHistory,
).extend({
	// Linha do tempo do pedido em ordem cronológica, com o nome de quem fez cada mudança
	async findBySaleId(saleId: string): Promise<SaleStatusHistory[]> {
		return this.createQueryBuilder("history")
			.select(["history.id", "history.status", "history.created_at"])
			.leftJoin("history.changed_by", "changed_by")
			.addSelect(["changed_by.id", "changed_by.name"])
			.where("history.sale_id = :saleId", { saleId })
			.orderBy("history.created_at", "ASC")
			.getMany();
	},
});
