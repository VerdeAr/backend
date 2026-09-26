import { Router } from "express";
import { SaleController } from "@/controllers/sale.controller";
import { UserRole } from "@/entities/enums";
import { ensureAuthenticated, ensureRole } from "@/middlewares/auth.middleware";

const saleRoutes = Router();
const saleController = new SaleController();

// Todas as rotas de vendas exigem usuário autenticado
saleRoutes.use(ensureAuthenticated);

// Rotas do Consumidor
saleRoutes.post("/checkout", saleController.checkout);
saleRoutes.get("/minhas-compras", saleController.getMyPurchases);
saleRoutes.get("/:id", saleController.getPurchaseById);

// Rota de alteração de status (acessível por vendedores)
saleRoutes.patch(
	"/:id/status",
	ensureRole([UserRole.VENDEDOR]),
	saleController.updateStatus,
);

export { saleRoutes };
