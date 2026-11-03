import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { cacheControl } from "@/middlewares/cache.middleware";

const categoryRoutes = Router();
const productController = new ProductController();

categoryRoutes.get(
	"/",
	cacheControl("public, max-age=300"),
	productController.listCategories,
);

export { categoryRoutes };
