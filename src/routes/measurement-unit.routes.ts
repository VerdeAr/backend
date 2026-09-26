import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";

const measurementUnitRoutes = Router();
const productController = new ProductController();

measurementUnitRoutes.get("/", productController.listMeasurementUnits);

export { measurementUnitRoutes };
