import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post("/register", validate(registerSchema), controller.register);
authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.get("/me", ensureAuthenticated, controller.me);

export { authRoutes };
