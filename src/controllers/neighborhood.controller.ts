import type { NextFunction, Request, Response } from "express";
import { NeighborhoodService } from "@/services/neighborhood.service";

const neighborhoodService = new NeighborhoodService();

export class NeighborhoodController {
	async listAll(_req: Request, res: Response, next: NextFunction) {
		try {
			const neighborhoods = await neighborhoodService.listAll();
			return res.status(200).json(neighborhoods);
		} catch (error) {
			next(error);
		}
	}
}
