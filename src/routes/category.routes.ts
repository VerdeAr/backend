import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";

const categoryRoutes = Router();
const productController = new ProductController();

categoryRoutes.get("/", productController.listCategories);

export { categoryRoutes };
