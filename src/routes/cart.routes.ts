import { Router } from "express";
import { CartController } from "@/controllers/cart.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";
import { cacheControl } from "@/middlewares/cache.middleware";

const cartRoutes = Router();
const cartController = new CartController();

// Todas as operações de carrinho exigem autenticação do usuário e não devem ser cacheadas publicamente
cartRoutes.use(ensureAuthenticated);
cartRoutes.use(cacheControl("private, no-cache"));

cartRoutes.get("/", cartController.getCart);
cartRoutes.post("/itens", cartController.addItem);
cartRoutes.patch("/itens/:id", cartController.updateQuantity);
cartRoutes.delete("/itens/:id", cartController.removeItem);
cartRoutes.delete("/", cartController.clear);
cartRoutes.post("/entrega", cartController.setDeliveryType);
cartRoutes.post("/pagamento", cartController.setPaymentMethod);

export { cartRoutes };
