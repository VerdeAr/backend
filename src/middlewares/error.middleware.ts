import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const errorHandler = (
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	if (err instanceof ZodError) {
		return res.status(400).json({
			message: "Falha de validação",
			errors: err.issues.map((i) => ({
				field: i.path.join("."),
				message: i.message,
			})),
		});
	}

	if (
		err.message === "Credenciais inválidas." ||
		err.message === "E-mail já está em uso."
	) {
		return res.status(400).json({ message: err.message });
	}

	return res.status(500).json({ message: "Erro interno do servidor." });
};
