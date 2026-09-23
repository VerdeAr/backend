import type { NextFunction, Request, Response } from "express";
import { PersonService } from "@/services/person.service";

const personService = new PersonService();

export class PersonController {
	async updateProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await personService.updateProfile(req.user!.id, req.body);
			return res.status(200).json({
				success: true,
				...result,
			});
		} catch (error) {
			next(error);
		}
	}

	async updatePassword(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await personService.updatePassword(req.user!.id, req.body);
			return res.status(200).json({
				success: true,
				...result,
			});
		} catch (error) {
			next(error);
		}
	}

	async updateShipping(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await personService.updateShippingRate(
				req.user!.id,
				req.body,
			);
			return res.status(200).json({
				success: true,
				...result,
			});
		} catch (error) {
			next(error);
		}
	}
}
