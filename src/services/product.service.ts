import { AppError } from "@/errors/AppError";
import {
	categoryRepository,
	measurementUnitRepository,
	productRepository,
	sellerRepository,
} from "@/repositories";
import type {
	CreateProductInput,
	ProductFilterQuery,
	UpdateProductInput,
} from "@/schemas/product.schema";

export class ProductService {
	// ==================== Catálogo Público ====================

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

	// ==================== Painel do Produtor (Vendedor) ====================

	private async getSellerByUserId(userId: string) {
		const seller = await sellerRepository.findByUserId(userId);
		if (!seller) {
			throw new AppError(
				"Perfil de produtor rural não encontrado para este usuário.",
				404,
			);
		}
		return seller;
	}

	async listBySeller(userId: string) {
		const seller = await this.getSellerByUserId(userId);
		return productRepository.findBySeller(seller.id);
	}

	async createProduct(userId: string, data: CreateProductInput) {
		const seller = await this.getSellerByUserId(userId);

		if (data.category_id) {
			const category = await categoryRepository.findOne({
				where: { id: data.category_id },
			});
			if (!category) {
				throw new AppError("Categoria selecionada não existe.", 404);
			}
		}

		if (data.measurement_unit_id) {
			const unit = await measurementUnitRepository.findOne({
				where: { id: data.measurement_unit_id },
			});
			if (!unit) {
				throw new AppError("Unidade de medida selecionada não existe.", 404);
			}
		}

		const product = productRepository.create({
			name: data.name.trim(),
			price: data.price,
			stock: data.stock,
			seller_id: seller.id,
			category_id: data.category_id || null,
			measurement_unit_id: data.measurement_unit_id || null,
			description: data.description ? data.description.trim() : null,
			image_url: data.image_url ? data.image_url.trim() : null,
			is_active: data.is_active ?? true,
		});

		await productRepository.save(product);
		return productRepository.findByIdWithDetails(product.id);
	}

	async updateProduct(
		userId: string,
		productId: string,
		data: UpdateProductInput,
	) {
		const seller = await this.getSellerByUserId(userId);

		const product = await productRepository.findOne({
			where: { id: productId },
		});
		if (!product) {
			throw new AppError("Produto não encontrado.", 404);
		}

		if (product.seller_id !== seller.id) {
			throw new AppError(
				"Acesso negado: este produto não pertence ao seu perfil de vendedor.",
				403,
			);
		}

		if (data.category_id) {
			const category = await categoryRepository.findOne({
				where: { id: data.category_id },
			});
			if (!category) {
				throw new AppError("Categoria selecionada não existe.", 404);
			}
		}

		if (data.measurement_unit_id) {
			const unit = await measurementUnitRepository.findOne({
				where: { id: data.measurement_unit_id },
			});
			if (!unit) {
				throw new AppError("Unidade de medida selecionada não existe.", 404);
			}
		}

		if (data.name !== undefined) product.name = data.name.trim();
		if (data.price !== undefined) product.price = data.price;
		if (data.stock !== undefined) product.stock = data.stock;
		if (data.category_id !== undefined)
			product.category_id = data.category_id || null;
		if (data.measurement_unit_id !== undefined)
			product.measurement_unit_id = data.measurement_unit_id || null;
		if (data.description !== undefined)
			product.description = data.description ? data.description.trim() : null;
		if (data.image_url !== undefined)
			product.image_url = data.image_url ? data.image_url.trim() : null;
		if (data.is_active !== undefined) product.is_active = data.is_active;

		await productRepository.save(product);
		return productRepository.findByIdWithDetails(product.id);
	}

	async toggleProductActive(userId: string, productId: string) {
		const seller = await this.getSellerByUserId(userId);

		const product = await productRepository.findOne({
			where: { id: productId },
		});
		if (!product) {
			throw new AppError("Produto não encontrado.", 404);
		}

		if (product.seller_id !== seller.id) {
			throw new AppError(
				"Acesso negado: este produto não pertence ao seu perfil de vendedor.",
				403,
			);
		}

		product.is_active = !product.is_active;
		await productRepository.save(product);

		return {
			id: product.id,
			is_active: product.is_active,
			message: product.is_active
				? "Anúncio do produto ativado com sucesso."
				: "Anúncio do produto desativado com sucesso.",
		};
	}

	async deleteProduct(userId: string, productId: string) {
		const seller = await this.getSellerByUserId(userId);

		const product = await productRepository.findOne({
			where: { id: productId },
		});
		if (!product) {
			throw new AppError("Produto não encontrado.", 404);
		}

		if (product.seller_id !== seller.id) {
			throw new AppError(
				"Acesso negado: este produto não pertence ao seu perfil de vendedor.",
				403,
			);
		}

		try {
			await productRepository.remove(product);
			return { message: "Produto excluído com sucesso." };
		} catch {
			product.is_active = false;
			await productRepository.save(product);
			return {
				message:
					"O produto possui histórico de vendas e foi desativado do catálogo.",
			};
		}
	}
}
