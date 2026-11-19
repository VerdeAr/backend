import type { Cart } from "@/entities/Cart";
import { DeliveryType } from "@/entities/enums";
import { AppError } from "@/errors/AppError";
import {
	cartItemRepository,
	cartRepository,
	productRepository,
	userRepository,
} from "@/repositories";
import type { AddCartItemInput } from "@/schemas/cart.schema";
import {
	outOfRadiusMessage,
	type SellerShippingQuote,
	type SellerShippingSource,
	shippingService,
} from "./shipping.service";

// Situação do frete no carrinho (VER-91). O carrinho nunca trava por causa do frete:
// em caso de problema, mostra a mensagem e o checkout recusa a Entrega.
export type CartShippingStatus =
	| "OK"
	| "FORA_DO_RAIO"
	| "SEM_ENDERECO"
	| "INDISPONIVEL";

export interface FormattedCartResponse {
	id: string;
	user_id: string;
	delivery_type: DeliveryType | null;
	payment_method: string | null;
	items: FormattedCartItem[];
	subtotal: number;
	shipping: number;
	// null quando a modalidade não é Entrega ou o carrinho está vazio
	shipping_status: CartShippingStatus | null;
	shipping_message: string | null;
	shipping_details: SellerShippingQuote[];
	total: number;
	total_items: number;
	created_at: Date;
	updated_at: Date;
}

export interface FormattedCartItem {
	id: string;
	cart_id: string;
	product_id: string;
	quantity: number;
	price: number;
	total: number;
	product: {
		id: string;
		name: string;
		price: number;
		stock: number;
		image_url?: string | null;
		category?: { id: string; name: string } | null;
		measurement_unit?: {
			id: string;
			name: string;
			symbol?: string | null;
		} | null;
		seller?: {
			id: string;
			farm_name?: string | null;
			user?: {
				id: string;
				name: string;
				fixed_shipping_rate?: number | null;
			} | null;
		} | null;
	};
	created_at: Date;
	updated_at: Date;
}

export class CartService {
	/**
	 * Formata o carrinho calculando subtotal, taxa de entrega por produtor e total geral.
	 */
	private async formatCart(cart: Cart): Promise<FormattedCartResponse> {
		let subtotal = 0;
		let totalItems = 0;

		const sellers: SellerShippingSource[] = [];

		const formattedItems: FormattedCartItem[] = (cart.items || []).map(
			(item) => {
				const quantity = Number(item.quantity);
				const price = Number(item.price);
				const itemTotal = Number((quantity * price).toFixed(2));

				subtotal += itemTotal;
				totalItems += quantity;

				// Coleta os produtores do carrinho; o frete é calculado uma vez por produtor
				const seller = item.product?.seller;
				if (seller?.id) {
					sellers.push(seller);
				}

				return {
					id: item.id,
					cart_id: item.cart_id,
					product_id: item.product_id,
					quantity,
					price,
					total: itemTotal,
					product: {
						id: item.product.id,
						name: item.product.name,
						price: Number(item.product.price),
						stock: Number(item.product.stock),
						image_url: item.product.image_url,
						category: item.product.category
							? {
									id: item.product.category.id,
									name: item.product.category.name,
								}
							: null,
						measurement_unit: item.product.measurement_unit
							? {
									id: item.product.measurement_unit.id,
									name: item.product.measurement_unit.name,
									symbol: item.product.measurement_unit.symbol,
								}
							: null,
						seller: seller
							? {
									id: seller.id,
									farm_name: seller.farm_name,
									user: seller.user
										? {
												id: seller.user.id,
												name: seller.user.name,
												fixed_shipping_rate: seller.user.fixed_shipping_rate
													? Number(seller.user.fixed_shipping_rate)
													: null,
											}
										: null,
								}
							: null,
					},
					created_at: item.created_at,
					updated_at: item.updated_at,
				};
			},
		);

		// Calcula frete apenas se a modalidade for ENTREGA e houver itens
		let shipping = 0;
		let shippingStatus: CartShippingStatus | null = null;
		let shippingMessage: string | null = null;
		let shippingDetails: SellerShippingQuote[] = [];

		if (
			cart.delivery_type === DeliveryType.ENTREGA &&
			formattedItems.length > 0
		) {
			try {
				const customer = await userRepository.findOne({
					where: { id: cart.user_id },
				});
				shippingDetails = await shippingService.quoteSellers(sellers, customer);
				shipping = shippingService.sumQuotes(shippingDetails).shipping_amount;

				const outOfRadius = shippingDetails.find(
					(quote) => !quote.within_radius,
				);
				shippingStatus = outOfRadius ? "FORA_DO_RAIO" : "OK";
				shippingMessage = outOfRadius ? outOfRadiusMessage(outOfRadius) : null;
			} catch (error) {
				if (!(error instanceof AppError)) throw error;

				shipping = 0;
				shippingDetails = [];
				shippingStatus =
					error.statusCode === 400 ? "SEM_ENDERECO" : "INDISPONIVEL";
				shippingMessage = error.message;
			}
		}

		subtotal = Number(subtotal.toFixed(2));
		shipping = Number(shipping.toFixed(2));
		const total = Number((subtotal + shipping).toFixed(2));

		return {
			id: cart.id,
			user_id: cart.user_id,
			delivery_type: cart.delivery_type,
			payment_method: cart.payment_method,
			items: formattedItems,
			subtotal,
			shipping,
			shipping_status: shippingStatus,
			shipping_message: shippingMessage,
			shipping_details: shippingDetails,
			total,
			total_items: Number(totalItems.toFixed(3)),
			created_at: cart.created_at,
			updated_at: cart.updated_at,
		};
	}

	/**
	 * Obtém o carrinho do usuário autenticado (ou cria caso ainda não exista).
	 */
	async getCart(userId: string): Promise<FormattedCartResponse> {
		const cart = await cartRepository.getOrCreate(userId);
		return this.formatCart(cart);
	}

	/**
	 * Adiciona um item ao carrinho ou incrementa quantidade respeitando o estoque.
	 */
	async addItem(
		userId: string,
		data: AddCartItemInput,
	): Promise<FormattedCartResponse> {
		const product = await productRepository.findOne({
			where: { id: data.product_id },
		});

		if (!product?.is_active) {
			throw new AppError("Produto não encontrado ou indisponível.", 404);
		}

		if (Number(product.stock) <= 0) {
			throw new AppError("Este produto está esgotado no momento.", 400);
		}

		const cart = await cartRepository.getOrCreate(userId);
		const existingItem = await cartItemRepository.findByCartAndProduct(
			cart.id,
			product.id,
		);

		if (existingItem) {
			const newQuantity = Number(existingItem.quantity) + data.quantity;
			if (newQuantity > Number(product.stock)) {
				throw new AppError(
					`A quantidade solicitada (${newQuantity}) excede o estoque disponível (${product.stock}).`,
					400,
				);
			}

			existingItem.quantity = newQuantity;
			existingItem.price = Number(product.price);
			await cartItemRepository.save(existingItem);
		} else {
			if (data.quantity > Number(product.stock)) {
				throw new AppError(
					`A quantidade solicitada (${data.quantity}) excede o estoque disponível (${product.stock}).`,
					400,
				);
			}

			const newItem = cartItemRepository.create({
				cart_id: cart.id,
				product_id: product.id,
				quantity: data.quantity,
				price: Number(product.price),
			});

			await cartItemRepository.save(newItem);
		}

		return this.getCart(userId);
	}

	/**
	 * Atualiza a quantidade de um item existente no carrinho.
	 */
	async updateItemQuantity(
		userId: string,
		itemId: string,
		quantity: number,
	): Promise<FormattedCartResponse> {
		if (quantity <= 0) {
			throw new AppError("A quantidade do item deve ser maior que zero.", 400);
		}

		const item = await cartItemRepository.findByIdWithCart(itemId);
		if (!item || item.cart.user_id !== userId) {
			throw new AppError("Item não encontrado no seu carrinho.", 404);
		}

		if (!item.product?.is_active) {
			throw new AppError("Produto indisponível para compra.", 400);
		}

		if (quantity > Number(item.product.stock)) {
			throw new AppError(
				`A quantidade solicitada (${quantity}) excede o estoque disponível (${item.product.stock}).`,
				400,
			);
		}

		item.quantity = quantity;
		item.price = Number(item.product.price);
		await cartItemRepository.save(item);

		return this.getCart(userId);
	}

	/**
	 * Remove um item do carrinho.
	 */
	async removeItem(
		userId: string,
		itemId: string,
	): Promise<FormattedCartResponse> {
		const item = await cartItemRepository.findByIdWithCart(itemId);
		if (!item || item.cart.user_id !== userId) {
			throw new AppError("Item não encontrado no seu carrinho.", 404);
		}

		await cartItemRepository.remove(item);
		return this.getCart(userId);
	}

	/**
	 * Esvazia completamente o carrinho do usuário.
	 */
	async clearCart(userId: string): Promise<FormattedCartResponse> {
		const cart = await cartRepository.getOrCreate(userId);
		await cartItemRepository.delete({ cart_id: cart.id });
		return this.getCart(userId);
	}

	/**
	 * Atualiza a modalidade de entrega (ENTREGA ou RETIRADA).
	 */
	async setDeliveryType(
		userId: string,
		deliveryType: DeliveryType,
	): Promise<FormattedCartResponse> {
		const cart = await cartRepository.getOrCreate(userId);
		cart.delivery_type = deliveryType;
		await cartRepository.save(cart);
		return this.getCart(userId);
	}

	/**
	 * Salva a preferência de método de pagamento no carrinho.
	 */
	async setPaymentMethod(
		userId: string,
		paymentMethod: string,
	): Promise<FormattedCartResponse> {
		const cart = await cartRepository.getOrCreate(userId);
		cart.payment_method = paymentMethod;
		await cartRepository.save(cart);
		return this.getCart(userId);
	}
}

export const cartService = new CartService();
