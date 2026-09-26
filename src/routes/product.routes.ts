import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";

const productRoutes = Router();
const productController = new ProductController();

productRoutes.get("/", productController.list);
productRoutes.get("/:id", productController.getById);

export { productRoutes };
