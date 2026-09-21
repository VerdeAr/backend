import process from "node:process";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
	id: string;
}

export const ensureAuthenticated = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({ message: "Token não fornecido." });
	}

	const [, token] = authHeader.split(" ");

	try {
		const secret = process.env.JWT_SECRET!;
		const decoded = jwt.verify(token, secret) as JwtPayload;
		req.user = { id: decoded.id };
		return next();
	} catch {
		return res.status(401).json({ message: "Token inválido ou expirado." });
	}
};
