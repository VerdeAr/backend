import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export const errorHandler = (
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			...(err.errors ? { errors: err.errors } : {}),
		});
	}

	if (err instanceof ZodError) {
		return res.status(400).json({
			success: false,
			message: "Falha de validação dos dados de entrada.",
			errors: err.issues.map((i) => ({
				field: i.path.join("."),
				message: i.message,
			})),
		});
	}

	console.error("❌ Erro interno não tratado:", err);
	return res.status(500).json({
		success: false,
		message: "Erro interno do servidor.",
	});
};
