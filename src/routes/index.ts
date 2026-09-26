import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { cartRoutes } from "./cart.routes";
import { categoryRoutes } from "./category.routes";
import { measurementUnitRoutes } from "./measurement-unit.routes";
import { neighborhoodRoutes } from "./neighborhood.routes";
import { personRoutes } from "./person.routes";
import { productRoutes } from "./product.routes";
import { saleRoutes } from "./sale.routes";
import { sellerOrderRoutes } from "./seller-order.routes";
import { sellerProductRoutes } from "./seller-product.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pessoa", personRoutes);
router.use("/bairros", neighborhoodRoutes);
router.use("/produtos", productRoutes);
router.use("/categorias", categoryRoutes);
router.use("/unidades-medida", measurementUnitRoutes);
router.use("/vendedor/produtos", sellerProductRoutes);
router.use("/vendedor/pedidos", sellerOrderRoutes);
router.use("/carrinho", cartRoutes);
router.use("/vendas", saleRoutes);

export { router };
