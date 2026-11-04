import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";
import { cacheControl } from "@/middlewares/cache.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post("/register", validate(registerSchema), controller.register);
authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/logout", controller.logout);
authRoutes.get(
	"/me",
	ensureAuthenticated,
	cacheControl("private, no-cache"),
	controller.me,
);

export { authRoutes };
