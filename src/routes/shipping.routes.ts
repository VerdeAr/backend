import process from "node:process";
import { Router } from "express";
import { ShippingController } from "@/controllers/shipping.controller";
import { cacheControl } from "@/middlewares/cache.middleware";
import { rateLimit } from "@/middlewares/rate-limit.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { calculateRouteSchema } from "@/schemas/shipping.schema";

const shippingRoutes = Router();
const controller = new ShippingController();

// Público (simulação na PDP por visitante), com limite por IP para proteger a cota do ORS
shippingRoutes.post(
	"/calcular-rota",
	rateLimit({
		windowMs: 60_000,
		max: Number(process.env.SHIPPING_ROUTE_RATE_LIMIT) || 30,
		message:
			"Muitas simulações de frete em pouco tempo. Aguarde um minuto e tente novamente.",
	}),
	cacheControl("no-store"),
	validate(calculateRouteSchema),
	controller.calculateRoute,
);

export { shippingRoutes };
