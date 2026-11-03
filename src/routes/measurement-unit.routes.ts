import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { cacheControl } from "@/middlewares/cache.middleware";

const measurementUnitRoutes = Router();
const productController = new ProductController();

measurementUnitRoutes.get(
	"/",
	cacheControl("public, max-age=300"),
	productController.listMeasurementUnits,
);

export { measurementUnitRoutes };
