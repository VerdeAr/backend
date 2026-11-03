import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { cacheControl } from "@/middlewares/cache.middleware";

const productRoutes = Router();
const productController = new ProductController();

productRoutes.get("/", cacheControl("no-cache"), productController.list);
productRoutes.get("/:id", cacheControl("no-cache"), productController.getById);

export { productRoutes };
