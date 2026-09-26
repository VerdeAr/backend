import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { categoryRoutes } from "./category.routes";
import { measurementUnitRoutes } from "./measurement-unit.routes";
import { neighborhoodRoutes } from "./neighborhood.routes";
import { personRoutes } from "./person.routes";
import { productRoutes } from "./product.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pessoa", personRoutes);
router.use("/bairros", neighborhoodRoutes);
router.use("/produtos", productRoutes);
router.use("/categorias", categoryRoutes);
router.use("/unidades-medida", measurementUnitRoutes);

export { router };
