import type { NextFunction, Request, Response } from "express";
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

const TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string) {
	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: TOKEN_COOKIE_MAX_AGE_MS,
	});
}

export class AuthController {
	async register(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.register(req.body);
			setAuthCookie(res, result.token);
			return res.status(201).json(result);
		} catch (error) {
			next(error);
		}
	}

	async login(req: Request, res: Response, next: NextFunction) {
		try {
			const result = await authService.login(req.body);
			setAuthCookie(res, result.token);
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

	async logout(_req: Request, res: Response, next: NextFunction) {
		try {
			res.clearCookie("token");
			return res.status(200).json({
				success: true,
				message: "Logout realizado com sucesso.",
			});
		} catch (error) {
			next(error);
		}
	}
}
