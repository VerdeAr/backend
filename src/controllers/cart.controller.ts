import type { NextFunction, Request, Response } from "express";
import {
	addCartItemSchema,
	cartItemIdParamSchema,
	setDeliveryTypeSchema,
	setPaymentMethodSchema,
	updateCartItemQuantitySchema,
} from "@/schemas/cart.schema";
import { cartService } from "@/services/cart.service";

export class CartController {
	/**
	 * GET /carrinho
	 * Retorna o carrinho do usuário autenticado com dados completos e cálculos.
	 */
	async getCart(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const cart = await cartService.getCart(userId);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /carrinho/itens
	 * Adiciona um item ao carrinho ou incrementa quantidade respeitando o estoque.
	 */
	async addItem(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const data = addCartItemSchema.parse(req.body);
			const cart = await cartService.addItem(userId, data);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PATCH /carrinho/itens/:id
	 * Atualiza a quantidade de um item do carrinho.
	 */
	async updateQuantity(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const { id } = cartItemIdParamSchema.parse(req.params);
			const { quantity } = updateCartItemQuantitySchema.parse(req.body);
			const cart = await cartService.updateItemQuantity(userId, id, quantity);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /carrinho/itens/:id
	 * Remove um item do carrinho.
	 */
	async removeItem(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const { id } = cartItemIdParamSchema.parse(req.params);
			const cart = await cartService.removeItem(userId, id);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * DELETE /carrinho
	 * Esvazia todos os itens do carrinho do usuário.
	 */
	async clear(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const cart = await cartService.clearCart(userId);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /carrinho/entrega
	 * Define modalidade de entrega (ENTREGA ou RETIRADA) e recalcula frete.
	 */
	async setDeliveryType(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const { delivery_type } = setDeliveryTypeSchema.parse(req.body);
			const cart = await cartService.setDeliveryType(userId, delivery_type);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /carrinho/pagamento
	 * Define a forma de pagamento preferencial para o carrinho.
	 */
	async setPaymentMethod(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const { payment_method } = setPaymentMethodSchema.parse(req.body);
			const cart = await cartService.setPaymentMethod(userId, payment_method);
			return res.status(200).json(cart);
		} catch (error) {
			next(error);
		}
	}
}
