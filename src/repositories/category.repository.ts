import { AppDataSource } from "@/config/database";
import { Category } from "@/entities/Category";

export const categoryRepository = AppDataSource.getRepository(Category).extend({
	findAllOrdered() {
		return this.find({
			order: { name: "ASC" },
		});
	},
});
