import process from "node:process";
import type { NextFunction, Request, Response } from "express";
import { healthService } from "@/services/health.service";

export class HealthController {
	async live(_req: Request, res: Response) {
		return res.status(200).json({
			status: "ok",
			uptime: Math.round(process.uptime()),
		});
	}

	async ready(_req: Request, res: Response, next: NextFunction) {
		try {
			const databaseUp = await healthService.isDatabaseUp();

			if (!databaseUp) {
				return res.status(503).json({
					status: "unavailable",
					database: "down",
				});
			}

			return res.status(200).json({
				status: "ready",
				database: "up",
			});
		} catch (error) {
			next(error);
		}
	}
}
