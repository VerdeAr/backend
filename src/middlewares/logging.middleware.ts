import type { NextFunction, Request, Response } from "express";

export function loggingMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const startTime = Date.now();

	res.on("finish", () => {
		const duration = Date.now() - startTime;
		const method = req.method;
		const url = req.originalUrl || req.url;
		const status = res.statusCode;

		const statusColor =
			status >= 500
				? "\x1b[31m" // vermelho
				: status >= 400
					? "\x1b[33m" // amarelo
					: status >= 300
						? "\x1b[36m" // ciano
						: "\x1b[32m"; // verde
		const resetColor = "\x1b[0m";

		console.log(
			`[HTTP] ${method.padEnd(6)} ${url} ${statusColor}${status}${resetColor} - ${duration}ms`,
		);
	});

	next();
}
