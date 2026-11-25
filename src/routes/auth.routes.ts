import process from "node:process";
import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";
import { cacheControl } from "@/middlewares/cache.middleware";
import { rateLimit } from "@/middlewares/rate-limit.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

const authRoutes = Router();
const controller = new AuthController();

// Cada cadastro envia um e-mail de boas-vindas (VER-83): o limite por IP impede o uso do
// cadastro para disparar e-mails a endereços de terceiros e protege a cota do Resend
authRoutes.post(
	"/register",
	rateLimit({
		windowMs: 60 * 60_000,
		max: Number(process.env.REGISTER_RATE_LIMIT) || 10,
		message:
			"Muitos cadastros feitos a partir desta rede. Aguarde e tente novamente mais tarde.",
	}),
	validate(registerSchema),
	controller.register,
);
authRoutes.post("/login", validate(loginSchema), controller.login);
authRoutes.post("/logout", controller.logout);
authRoutes.get(
	"/me",
	ensureAuthenticated,
	cacheControl("private, no-cache"),
	controller.me,
);

export { authRoutes };
