import { AppDataSource } from "@/config/database";
import { Seller } from "@/entities/Seller";

export const sellerRepository = AppDataSource.getRepository(Seller).extend({
	findByUserId(userId: string) {
		return this.findOne({
			where: { user_id: userId },
			relations: { user: true },
		});
	},
});
