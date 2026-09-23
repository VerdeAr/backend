import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { personRoutes } from "./person.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/pessoa", personRoutes);

export { router };
