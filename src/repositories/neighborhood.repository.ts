import { AppDataSource } from "@/config/database";
import { Neighborhood } from "@/entities/Neighborhood";

export const neighborhoodRepository = AppDataSource.getRepository(
	Neighborhood,
).extend({
	findAllOrdered() {
		return this.find({
			order: { name: "ASC" },
		});
	},
});
