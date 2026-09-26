import { Router } from "express";
import { SaleController } from "@/controllers/sale.controller";
import { UserRole } from "@/entities/enums";
import { ensureAuthenticated, ensureRole } from "@/middlewares/auth.middleware";

const sellerOrderRoutes = Router();
const saleController = new SaleController();

// Todas as rotas de pedidos do vendedor exigem autenticação e papel de VENDEDOR
sellerOrderRoutes.use(ensureAuthenticated);
sellerOrderRoutes.use(ensureRole([UserRole.VENDEDOR]));

sellerOrderRoutes.get("/", saleController.getSellerOrders);
sellerOrderRoutes.get("/pendentes/count", saleController.countPendingOrders);
sellerOrderRoutes.patch("/:id/status", saleController.updateStatus);

export { sellerOrderRoutes };
