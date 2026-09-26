import { Router } from "express";
import { ProductController } from "@/controllers/product.controller";
import { UserRole } from "@/entities/enums";
import { ensureAuthenticated, ensureRole } from "@/middlewares/auth.middleware";

const sellerProductRoutes = Router();
const productController = new ProductController();

// Todas as rotas de produtos do vendedor exigem autenticação e papel de VENDEDOR
sellerProductRoutes.use(ensureAuthenticated);
sellerProductRoutes.use(ensureRole([UserRole.VENDEDOR]));

sellerProductRoutes.get("/", productController.listSellerProducts);
sellerProductRoutes.post("/", productController.create);
sellerProductRoutes.put("/:id", productController.update);
sellerProductRoutes.patch("/:id/toggle-ativo", productController.toggleActive);
sellerProductRoutes.delete("/:id", productController.delete);

export { sellerProductRoutes };
