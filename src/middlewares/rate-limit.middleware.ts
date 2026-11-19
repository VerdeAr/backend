import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
	windowMs: number;
	max: number;
	message?: string;
}

// Limite simples por IP em janela fixa, em memória (uma instância da API).
// Protege a cota gratuita do OpenRouteService nos endpoints públicos (RNF-23).
export const rateLimit = ({ windowMs, max, message }: RateLimitOptions) => {
	const hits = new Map<string, { count: number; resetAt: number }>();

	return (req: Request, res: Response, next: NextFunction) => {
		const now = Date.now();
		const key = req.ip ?? "desconhecido";
		let entry = hits.get(key);

		if (!entry || entry.resetAt <= now) {
			// Limpa janelas vencidas para o mapa não crescer sem limite
			if (hits.size > 10_000) {
				for (const [ip, value] of hits) {
					if (value.resetAt <= now) hits.delete(ip);
				}
			}
			entry = { count: 0, resetAt: now + windowMs };
			hits.set(key, entry);
		}

		entry.count += 1;

		if (entry.count > max) {
			res.setHeader(
				"Retry-After",
				Math.ceil((entry.resetAt - now) / 1000).toString(),
			);
			return res.status(429).json({
				success: false,
				message:
					message ??
					"Muitas requisições em pouco tempo. Aguarde um instante e tente novamente.",
			});
		}

		next();
	};
};
