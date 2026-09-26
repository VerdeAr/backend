import { AppDataSource } from "@/config/database";
import { MeasurementUnit } from "@/entities/MeasurementUnit";

export const measurementUnitRepository = AppDataSource.getRepository(
	MeasurementUnit,
).extend({
	findAllOrdered() {
		return this.find({
			order: { name: "ASC" },
		});
	},
});
