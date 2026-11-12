import type { NextFunction, Request, Response } from "express";
import { shippingService } from "@/services/shipping.service";

export class ShippingController {
	/**
	 * POST /frete/calcular-rota
	 * Simula o frete de um vendedor até o destino (coordenadas ou CEP), com a rota.
	 */
	async calculateRoute(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await shippingService.simulateRoute(req.body);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}
