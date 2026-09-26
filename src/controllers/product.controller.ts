import type { NextFunction, Request, Response } from "express";
import {
	createProductSchema,
	productFilterQuerySchema,
	productIdParamSchema,
	updateProductSchema,
} from "@/schemas/product.schema";
import { ProductService } from "@/services/product.service";

const productService = new ProductService();

export class ProductController {
	// ==================== Catálogo Público ====================

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

	// ==================== Painel do Produtor (Vendedor) ====================

	async listSellerProducts(req: Request, res: Response, next: NextFunction) {
		try {
			const products = await productService.listBySeller(req.user!.id);
			return res.status(200).json(products);
		} catch (error) {
			next(error);
		}
	}

	async create(req: Request, res: Response, next: NextFunction) {
		try {
			const data = createProductSchema.parse(req.body);
			const product = await productService.createProduct(req.user!.id, data);
			return res.status(201).json(product);
		} catch (error) {
			next(error);
		}
	}

	async update(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = productIdParamSchema.parse(req.params);
			const data = updateProductSchema.parse(req.body);
			const product = await productService.updateProduct(
				req.user!.id,
				id,
				data,
			);
			return res.status(200).json(product);
		} catch (error) {
			next(error);
		}
	}

	async toggleActive(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = productIdParamSchema.parse(req.params);
			const result = await productService.toggleProductActive(req.user!.id, id);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}

	async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = productIdParamSchema.parse(req.params);
			const result = await productService.deleteProduct(req.user!.id, id);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}
}
