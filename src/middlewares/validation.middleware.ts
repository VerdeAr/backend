import type { NextFunction, Request, Response } from "express";
import type z from "zod";

export const validate = (schema: z.ZodType) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		req.body = schema.parse(req.body);
		next();
	};
};
