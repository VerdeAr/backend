import type { NextFunction, Request, Response } from "express";
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

export class AuthController {
	async register(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.register(req.body);
			return res.status(201).json(result);
		} catch (error) {
			next(error);
		}
	}

	async login(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.login(req.body);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}

	async me(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.getProfile(req.user!.id);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}
