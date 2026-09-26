import type { NextFunction, Request, Response } from "express";
import {
	checkoutSchema,
	saleIdParamSchema,
	sellerOrdersQuerySchema,
	updateSaleStatusSchema,
} from "@/schemas/sale.schema";
import { saleService } from "@/services/sale.service";

export class SaleController {
	/**
	 * POST /vendas/checkout
	 * Realiza o checkout transacional do carrinho com garantia ACID.
	 */
	async checkout(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const data = checkoutSchema.parse(req.body);
			const sale = await saleService.checkout(userId, data);
			return res.status(201).json(sale);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /vendas/minhas-compras
	 * Retorna a lista de compras realizadas pelo cliente autenticado.
	 */
	async getMyPurchases(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const purchases = await saleService.getMyPurchases(userId);
			return res.status(200).json(purchases);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /vendas/:id
	 * Retorna os detalhes de uma compra específica do cliente.
	 */
	async getPurchaseById(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const { id } = saleIdParamSchema.parse(req.params);
			const purchase = await saleService.getPurchaseById(userId, id);
			return res.status(200).json(purchase);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /vendedor/pedidos
	 * Retorna os pedidos recebidos pelo vendedor (com suporte a filtro por status).
	 */
	async getSellerOrders(req: Request, res: Response, next: NextFunction) {
		try {
			const sellerUserId = req.user!.id;
			const { status } = sellerOrdersQuerySchema.parse(req.query);
			const orders = await saleService.getSellerOrders(sellerUserId, status);
			return res.status(200).json(orders);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /vendedor/pedidos/pendentes/count
	 * Retorna o número de pedidos no status ABERTA para notificações do vendedor.
	 */
	async countPendingOrders(req: Request, res: Response, next: NextFunction) {
		try {
			const sellerUserId = req.user!.id;
			const result = await saleService.countPendingBySeller(sellerUserId);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PATCH /vendas/:id/status
	 * Atualiza o status do pedido para FINALIZADA ou CANCELADA (estornando estoque).
	 */
	async updateStatus(req: Request, res: Response, next: NextFunction) {
		try {
			const sellerUserId = req.user!.id;
			const { id } = saleIdParamSchema.parse(req.params);
			const { status } = updateSaleStatusSchema.parse(req.body);
			const order = await saleService.updateSaleStatus(
				sellerUserId,
				id,
				status,
			);
			return res.status(200).json(order);
		} catch (error) {
			next(error);
		}
	}
}
