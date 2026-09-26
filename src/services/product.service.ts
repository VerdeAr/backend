import { AppError } from "@/errors/AppError";
import {
	categoryRepository,
	measurementUnitRepository,
	productRepository,
} from "@/repositories";
import type { ProductFilterQuery } from "@/schemas/product.schema";

export class ProductService {
	async listPublic(query: ProductFilterQuery) {
		const categoryId = query.categoriaId || query.category_id;
		const sellerId = query.vendedorId || query.seller_id;
		const search = query.termo || query.search || query.q;
		const availableOnly = query.disponivel ?? true;
		const page = query.page ?? 1;
		const limit = query.limit ?? 12;
		const orderBy = query.orderBy ?? "created_at";
		const orderDir = query.orderDir ?? "DESC";

		return productRepository.findFiltered({
			categoryId,
			sellerId,
			search,
			availableOnly,
			page,
			limit,
			orderBy,
			orderDir,
		});
	}

	async getById(id: string) {
		const product = await productRepository.findByIdWithDetails(id);

		if (!product) {
			throw new AppError("Produto não encontrado.", 404);
		}

		if (!product.is_active || Number(product.stock) <= 0) {
			throw new AppError("Produto indisponível no momento.", 404);
		}

		return product;
	}

	async listCategories() {
		return categoryRepository.findAllOrdered();
	}

	async listMeasurementUnits() {
		return measurementUnitRepository.findAllOrdered();
	}
}
