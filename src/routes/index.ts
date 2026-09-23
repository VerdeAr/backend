import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { neighborhoodRoutes } from "./neighborhood.routes";
import { personRoutes } from "./person.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pessoa", personRoutes);
router.use("/bairros", neighborhoodRoutes);

export { router };
