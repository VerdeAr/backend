import type { NextFunction, Request, Response } from "express";
import {
	productFilterQuerySchema,
	productIdParamSchema,
} from "@/schemas/product.schema";
import { ProductService } from "@/services/product.service";

const productService = new ProductService();

export class ProductController {
	async list(req: Request, res: Response, next: NextFunction) {
		try {
			const query = productFilterQuerySchema.parse(req.query);
			const result = await productService.listPublic(query);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}

	async getById(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = productIdParamSchema.parse(req.params);
			const product = await productService.getById(id);
			return res.status(200).json(product);
		} catch (error) {
			next(error);
		}
	}

	async listCategories(_req: Request, res: Response, next: NextFunction) {
		try {
			const categories = await productService.listCategories();
			return res.status(200).json(categories);
		} catch (error) {
			next(error);
		}
	}

	async listMeasurementUnits(_req: Request, res: Response, next: NextFunction) {
		try {
			const units = await productService.listMeasurementUnits();
			return res.status(200).json(units);
		} catch (error) {
			next(error);
		}
	}
}
