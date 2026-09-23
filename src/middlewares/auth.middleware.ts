import process from "node:process";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@/entities/enums";

interface JwtPayload {
	id: string;
	role: UserRole;
}

export const ensureAuthenticated = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({
			success: false,
			message: "Token não fornecido.",
		});
	}

	const [, token] = authHeader.split(" ");

	try {
		const secret = process.env.JWT_SECRET!;
		const decoded = jwt.verify(token, secret) as JwtPayload;
		req.user = { id: decoded.id, role: decoded.role };
		return next();
	} catch {
		return res.status(401).json({
			success: false,
			message: "Token inválido ou expirado.",
		});
	}
};

export const ensureRole = (allowedRoles: UserRole[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: "Acesso negado: permissão insuficiente.",
			});
		}
		return next();
	};
};
