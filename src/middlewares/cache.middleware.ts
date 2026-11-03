import type { NextFunction, Request, Response } from "express";

/**
 * Middleware para definição de diretivas do cabeçalho Cache-Control.
 * A revalidação condicional (ETag e If-None-Match -> 304) é nativa do Express.
 */
export const cacheControl = (directives: string) => {
	return (_req: Request, res: Response, next: NextFunction) => {
		res.setHeader("Cache-Control", directives);
		next();
	};
};
