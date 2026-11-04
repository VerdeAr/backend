import type { EntityManager } from "typeorm";
import { AppDataSource } from "@/config/database";
import {
	Cart,
	CartItem,
	DeliveryType,
	Payment,
	PaymentMethod,
	Product,
	Sale,
	SaleAdjustment,
	SaleAdjustmentItem,
	SaleAdjustmentStatus,
	SaleProduct,
	SaleStatus,
	SaleStatusHistory,
} from "@/entities";
import { AppError, type ValidationErrorDetail } from "@/errors/AppError";
import {
	saleAdjustmentRepository,
	saleRepository,
	saleStatusHistoryRepository,
	sellerRepository,
} from "@/repositories";
import type {
	CheckoutInput,
	ProposeAdjustmentInput,
} from "@/schemas/sale.schema";
import {
	ADJUSTABLE_STATUSES,
	canSellerTransition,
} from "@/services/sale-status";

export interface FormattedSaleItem {
	id: string;
	product_id: string;
	product_name: string;
	product_image: string | null;
	measurement_unit: string | null;
	quantity: number;
	unit_price: number;
	total: number;
	seller?: {
		id: string;
		name: string;
		phone: string | null;
	} | null;
}

export interface FormattedPurchase {
	id: string;
	delivery_type: DeliveryType;
	status: SaleStatus;
	total_amount: number;
	created_at: Date;
	updated_at: Date;
	payments: {
		id: string;
		amount: number;
		payment_method: string | null;
	}[];
	items: FormattedSaleItem[];
}

export interface FormattedSellerOrder {
	id: string;
	status: SaleStatus;
	delivery_type: DeliveryType;
	created_at: Date;
	customer: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
		address: string | null;
		neighborhood: string | null;
	};
	items: FormattedSaleItem[];
	seller_subtotal: number;
	order_total: number;
}

export interface FormattedStatusHistoryEntry {
	status: SaleStatus;
	changed_at: Date;
	changed_by: { id: string; name: string } | null;
}

export interface FormattedSaleAdjustmentItem {
	id: string;
	sale_product_id: string;
	product_id: string | null;
	product_name: string;
	original_quantity: number;
	proposed_quantity: number;
	original_unit_price: number;
	proposed_unit_price: number;
	original_total: number;
	proposed_total: number;
}

export interface FormattedSaleAdjustment {
	id: string;
	reason: string;
	status: SaleAdjustmentStatus;
	previous_status: SaleStatus;
	created_at: Date;
	items: FormattedSaleAdjustmentItem[];
	current_order_total: number;
	proposed_order_total: number;
}

export interface FormattedSellerOrderDetail {
	id: string;
	status: SaleStatus;
	delivery_type: DeliveryType;
	created_at: Date;
	updated_at: Date;
	payment_method: string | null;
	customer: FormattedSellerOrder["customer"];
	items: FormattedSaleItem[];
	seller_subtotal: number;
	order_total: number;
	status_history: FormattedStatusHistoryEntry[];
	pending_adjustment: FormattedSaleAdjustment | null;
}

export class SaleService {
	/**
	 * Realiza o checkout transacional com garantia ACID:
	 * 1. Executa sob transação controlada (AppDataSource.transaction).
	 * 2. Valida o carrinho do usuário e seus itens.
	 * 3. Valida a disponibilidade e aplica lock pessimista de escrita em cada produto.
	 * 4. Decrementa o estoque atomicamente.
	 * 5. Calcula o subtotal, o frete dinâmico dos produtores (se ENTREGA) e o total.
	 * 6. Cria o registro de Sale (Venda) com status inicial ABERTA.
	 * 7. Cria os registros em SaleProduct (VendaProduto).
	 * 8. Cria o registro de Payment (Pagamento) com a forma de pagamento selecionada.
	 * 9. Esvazia os itens do carrinho de compras do usuário.
	 * 10. Em caso de qualquer inconsistência, desfaz todas as alterações (rollback automático).
	 */
	async checkout(userId: string, data?: CheckoutInput): Promise<Sale> {
		const saleId = await AppDataSource.transaction(async (manager) => {
			// 1. Carrega o carrinho com itens e produtores
			const cart = await manager.findOne(Cart, {
				where: { user_id: userId },
				relations: {
					items: {
						product: {
							seller: {
								user: true,
							},
						},
					},
				},
			});

			if (!cart?.items || cart.items.length === 0) {
				throw new AppError(
					"O carrinho está vazio para realizar o checkout.",
					400,
				);
			}

			// 2. Determina a modalidade de entrega
			const deliveryType = data?.delivery_type || cart.delivery_type;
			if (!deliveryType) {
				throw new AppError(
					"Modalidade de entrega não definida. Escolha ENTREGA ou RETIRADA.",
					400,
				);
			}

			// 3. Determina a forma de pagamento
			const paymentMethodInput =
				data?.payment_method || cart.payment_method || "Dinheiro";

			// 4. Validação concorrente de estoque com lock pessimista de escrita e decremento atômico
			for (const item of cart.items) {
				const product = await manager
					.createQueryBuilder(Product, "product")
					.setLock("pessimistic_write")
					.where("product.id = :id", { id: item.product_id })
					.getOne();

				if (!product) {
					throw new AppError(
						`O produto "${item.product?.name || item.product_id}" não foi encontrado.`,
						404,
					);
				}

				if (!product.is_active) {
					throw new AppError(
						`O produto "${product.name}" foi desativado e não está disponível para compra.`,
						400,
					);
				}

				const requestedQty = Number(item.quantity);
				const availableStock = Number(product.stock);

				if (availableStock < requestedQty) {
					throw new AppError(
						`Estoque insuficiente para o produto "${product.name}". Disponível: ${availableStock}, solicitado: ${requestedQty}.`,
						400,
					);
				}

				// Decremento atômico de estoque
				product.stock = Number((availableStock - requestedQty).toFixed(3));
				await manager.save(product);
			}

			// 5. Cálculo dos valores: subtotal, frete por produtor e total
			let subtotal = 0;
			const distinctSellerShipping = new Map<string, number>();

			for (const item of cart.items) {
				const itemPrice = Number(item.price);
				const itemQty = Number(item.quantity);
				subtotal += itemPrice * itemQty;

				const seller = item.product?.seller;
				if (seller?.id && !distinctSellerShipping.has(seller.id)) {
					const fixedRate = seller.user?.fixed_shipping_rate
						? Number(seller.user.fixed_shipping_rate)
						: 0;
					distinctSellerShipping.set(seller.id, fixedRate);
				}
			}

			let shipping = 0;
			if (deliveryType === DeliveryType.ENTREGA) {
				for (const rate of distinctSellerShipping.values()) {
					shipping += rate;
				}
			}

			subtotal = Number(subtotal.toFixed(2));
			shipping = Number(shipping.toFixed(2));
			const totalAmount = Number((subtotal + shipping).toFixed(2));

			// 6. Criação do registro de Venda (Sale)
			const sale = manager.create(Sale, {
				customer_id: userId,
				delivery_type: deliveryType,
				total_amount: totalAmount,
				status: SaleStatus.ABERTA,
			});
			const savedSale = await manager.save(sale);
			await this.recordStatusChange(
				manager,
				savedSale.id,
				SaleStatus.ABERTA,
				userId,
			);

			// 7. Criação dos registros em VendaProduto (SaleProduct)
			const saleProducts = cart.items.map((item) =>
				manager.create(SaleProduct, {
					sale_id: savedSale.id,
					product_id: item.product_id,
					quantity: Number(item.quantity),
					unit_price: Number(item.price),
				}),
			);
			await manager.save(saleProducts);

			// 8. Resolução da forma de pagamento e criação de Payment
			let paymentMethodId: string | null = null;
			if (paymentMethodInput) {
				const isUuid =
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
						paymentMethodInput,
					);
				let paymentMethodRecord: PaymentMethod | null = null;

				if (isUuid) {
					paymentMethodRecord = await manager.findOne(PaymentMethod, {
						where: { id: paymentMethodInput },
					});
				}

				if (!paymentMethodRecord) {
					paymentMethodRecord = await manager
						.createQueryBuilder(PaymentMethod, "pm")
						.where("LOWER(pm.description) = LOWER(:desc)", {
							desc: paymentMethodInput,
						})
						.getOne();
				}

				if (paymentMethodRecord) {
					paymentMethodId = paymentMethodRecord.id;
				}
			}

			const payment = manager.create(Payment, {
				sale_id: savedSale.id,
				payment_method_id: paymentMethodId,
				amount: totalAmount,
			});
			await manager.save(payment);

			// 9. Esvazia o carrinho de compras do usuário
			await manager.delete(CartItem, { cart_id: cart.id });

			return savedSale.id;
		});

		// 10. Retorna a venda com os relacionamentos completos
		const createdSale = await AppDataSource.getRepository(Sale)
			.createQueryBuilder("sale")
			.leftJoinAndSelect("sale.customer", "customer")
			.leftJoinAndSelect("sale.items", "items")
			.leftJoinAndSelect("items.product", "product")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "seller_user")
			.addSelect(["seller_user.id", "seller_user.name", "seller_user.phone"])
			.leftJoinAndSelect("sale.payments", "payments")
			.leftJoinAndSelect("payments.payment_method", "payment_method")
			.where("sale.id = :id", { id: saleId })
			.getOne();

		return createdSale!;
	}

	/**
	 * Lista todas as compras realizadas pelo cliente logado.
	 */
	async getMyPurchases(customerId: string): Promise<FormattedPurchase[]> {
		const sales = await saleRepository.findByCustomerId(customerId);
		return sales.map((sale) => this.formatPurchase(sale));
	}

	/**
	 * Busca o detalhe de uma compra do cliente autenticado.
	 */
	async getPurchaseById(
		customerId: string,
		saleId: string,
	): Promise<FormattedPurchase> {
		const sale = await saleRepository.findByIdWithDetails(saleId);
		if (!sale || sale.customer_id !== customerId) {
			throw new AppError("Compra não encontrada.", 404);
		}
		return this.formatPurchase(sale);
	}

	/**
	 * Lista todos os pedidos recebidos pelo vendedor (com suporte a filtro de status).
	 */
	async getSellerOrders(
		sellerUserId: string,
		status?: SaleStatus,
	): Promise<FormattedSellerOrder[]> {
		const seller = await sellerRepository.findByUserId(sellerUserId);
		if (!seller) {
			throw new AppError("Perfil de vendedor não encontrado.", 404);
		}

		const sales = await saleRepository.findBySellerId(seller.id, status);

		return sales.map((sale) => {
			const { items, subtotal } = this.formatSellerItems(sale, seller.id);

			return {
				id: sale.id,
				status: sale.status,
				delivery_type: sale.delivery_type,
				created_at: sale.created_at,
				customer: this.formatSellerCustomer(sale),
				items,
				seller_subtotal: subtotal,
				order_total: Number(Number(sale.total_amount).toFixed(2)),
			};
		});
	}

	/**
	 * Detalhe de um pedido para o vendedor (RF-54): só os itens dele, os dados de contato
	 * e entrega do cliente, a linha do tempo de status e a proposta de ajuste pendente.
	 */
	async getSellerOrderDetail(
		sellerUserId: string,
		saleId: string,
	): Promise<FormattedSellerOrderDetail> {
		const seller = await sellerRepository.findByUserId(sellerUserId);
		if (!seller) {
			throw new AppError("Perfil de vendedor não encontrado.", 404);
		}

		const sale = await saleRepository.findSellerOrderDetail(saleId);
		if (!sale) {
			throw new AppError("Pedido não encontrado.", 404);
		}

		const { items, subtotal } = this.formatSellerItems(sale, seller.id);
		if (items.length === 0) {
			throw new AppError(
				"Você não tem permissão para acessar este pedido.",
				403,
			);
		}

		const [history, pendingAdjustment] = await Promise.all([
			saleStatusHistoryRepository.findBySaleId(sale.id),
			saleAdjustmentRepository.findPendingBySaleId(sale.id),
		]);

		return {
			id: sale.id,
			status: sale.status,
			delivery_type: sale.delivery_type,
			created_at: sale.created_at,
			updated_at: sale.updated_at,
			payment_method: sale.payments?.[0]?.payment_method?.description || null,
			customer: this.formatSellerCustomer(sale),
			items,
			seller_subtotal: subtotal,
			order_total: Number(Number(sale.total_amount).toFixed(2)),
			status_history: history.map((entry) => ({
				status: entry.status,
				changed_at: entry.created_at,
				changed_by: entry.changed_by
					? { id: entry.changed_by.id, name: entry.changed_by.name }
					: null,
			})),
			pending_adjustment: pendingAdjustment
				? this.formatAdjustment(pendingAdjustment, Number(sale.total_amount))
				: null,
		};
	}

	/**
	 * Vendedor propõe ajuste de quantidade ou pesagem dos próprios itens (RF-56).
	 * Não há alteração unilateral: o total, o pagamento e o estoque só mudam quando o
	 * cliente aceitar. O pedido fica em AGUARDANDO_APROVACAO_CLIENTE até a resposta.
	 */
	async proposeAdjustment(
		sellerUserId: string,
		saleId: string,
		data: ProposeAdjustmentInput,
	): Promise<FormattedSellerOrderDetail> {
		const seller = await sellerRepository.findByUserId(sellerUserId);
		if (!seller) {
			throw new AppError("Perfil de vendedor não encontrado.", 404);
		}

		await AppDataSource.transaction(async (manager) => {
			const sale = await this.lockSale(manager, saleId);
			if (!sale) {
				throw new AppError("Pedido não encontrado.", 404);
			}

			const saleItems = await manager.find(SaleProduct, {
				where: { sale_id: sale.id },
				relations: { product: true },
			});

			if (!saleItems.some((item) => item.product?.seller_id === seller.id)) {
				throw new AppError(
					"Você não tem permissão para ajustar este pedido.",
					403,
				);
			}

			if (sale.status === SaleStatus.AGUARDANDO_APROVACAO_CLIENTE) {
				throw new AppError(
					"Já existe uma proposta de ajuste aguardando a resposta do cliente.",
					409,
				);
			}

			if (!ADJUSTABLE_STATUSES.includes(sale.status)) {
				throw new AppError(
					`Não é possível propor ajuste em um pedido ${sale.status}. O ajuste só é permitido em pedidos ABERTA ou EM_PREPARACAO.`,
					400,
				);
			}

			const errors: ValidationErrorDetail[] = [];
			const adjustmentItems: Partial<SaleAdjustmentItem>[] = [];

			data.items.forEach((input, index) => {
				const saleItem = saleItems.find(
					(item) => item.id === input.sale_product_id,
				);

				if (!saleItem) {
					errors.push({
						field: `items.${index}.sale_product_id`,
						message: "Item não pertence a este pedido.",
					});
					return;
				}

				if (saleItem.product?.seller_id !== seller.id) {
					throw new AppError(
						"Você só pode ajustar os itens dos seus produtos.",
						403,
					);
				}

				const originalQuantity = Number(saleItem.quantity);
				const proposedQuantity = Number(input.quantity.toFixed(3));

				if (proposedQuantity === originalQuantity) {
					errors.push({
						field: `items.${index}.quantity`,
						message: "A quantidade proposta é igual à atual.",
					});
					return;
				}

				// Um aumento precisa caber no estoque disponível agora; o aceite confere de novo sob lock
				const increase = proposedQuantity - originalQuantity;
				const availableStock = Number(saleItem.product?.stock ?? 0);
				if (increase > availableStock) {
					errors.push({
						field: `items.${index}.quantity`,
						message: `Estoque insuficiente para o aumento de "${saleItem.product?.name}". Disponível: ${availableStock}, aumento solicitado: ${Number(increase.toFixed(3))}.`,
					});
					return;
				}

				// O preço unitário fica congelado na compra (RNF-08); o ajuste muda só a quantidade
				adjustmentItems.push({
					sale_product_id: saleItem.id,
					original_quantity: originalQuantity,
					original_unit_price: Number(saleItem.unit_price),
					proposed_quantity: proposedQuantity,
					proposed_unit_price: Number(saleItem.unit_price),
				});
			});

			if (errors.length > 0) {
				throw new AppError("Proposta de ajuste inválida.", 400, errors);
			}

			const adjustment = manager.create(SaleAdjustment, {
				sale_id: sale.id,
				seller_id: seller.id,
				reason: data.reason,
				status: SaleAdjustmentStatus.PENDENTE,
				previous_status: sale.status,
				responded_at: null,
				items: adjustmentItems.map((item) =>
					manager.create(SaleAdjustmentItem, item),
				),
			});
			await manager.save(adjustment);

			sale.status = SaleStatus.AGUARDANDO_APROVACAO_CLIENTE;
			await manager.save(sale);
			await this.recordStatusChange(
				manager,
				sale.id,
				SaleStatus.AGUARDANDO_APROVACAO_CLIENTE,
				sellerUserId,
			);
		});

		return this.getSellerOrderDetail(sellerUserId, saleId);
	}

	/**
	 * Retorna a contagem de pedidos que aguardam ação do vendedor (ABERTA e EM_PREPARACAO).
	 */
	async countPendingBySeller(sellerUserId: string): Promise<{ count: number }> {
		const seller = await sellerRepository.findByUserId(sellerUserId);
		if (!seller) {
			return { count: 0 };
		}

		const count = await saleRepository.countPendingBySellerId(seller.id);
		return { count };
	}

	/**
	 * Atualiza o status de uma venda com integridade transacional ACID, seguindo a
	 * máquina de estados de `sale-status.ts`.
	 * A linha do pedido é bloqueada (pessimistic_write) antes de qualquer leitura de status,
	 * o que serializa mudanças concorrentes: um pedido cancelado duas vezes, ao mesmo tempo
	 * ou em sequência, devolve o estoque uma única vez.
	 */
	async updateSaleStatus(
		sellerUserId: string,
		saleId: string,
		newStatus: SaleStatus,
	): Promise<FormattedSellerOrder> {
		const seller = await sellerRepository.findByUserId(sellerUserId);
		if (!seller) {
			throw new AppError("Perfil de vendedor não encontrado.", 404);
		}

		await AppDataSource.transaction(async (manager) => {
			const sale = await this.lockSale(manager, saleId);
			if (!sale) {
				throw new AppError("Pedido não encontrado.", 404);
			}

			const items = await manager.find(SaleProduct, {
				where: { sale_id: sale.id },
				relations: { product: true },
			});

			// Verifica se o vendedor possui produtos neste pedido
			const hasSellerProduct = items.some(
				(item) => item.product?.seller_id === seller.id,
			);

			if (!hasSellerProduct) {
				throw new AppError(
					"Você não tem permissão para alterar o status deste pedido.",
					403,
				);
			}

			// Validações de máquina de estados
			if (sale.status === newStatus) {
				return;
			}

			if (sale.status === SaleStatus.CANCELADA) {
				throw new AppError("Este pedido já se encontra cancelado.", 400);
			}

			if (sale.status === SaleStatus.FINALIZADA) {
				throw new AppError(
					"Este pedido já foi finalizado e não pode ter seu status alterado.",
					400,
				);
			}

			if (
				sale.status === SaleStatus.AGUARDANDO_APROVACAO_CLIENTE &&
				newStatus !== SaleStatus.CANCELADA
			) {
				throw new AppError(
					"Este pedido aguarda a resposta do cliente a uma proposta de ajuste e só pode ser cancelado.",
					400,
				);
			}

			if (!canSellerTransition(sale.status, newStatus, sale.delivery_type)) {
				throw new AppError(
					`Não é possível alterar o pedido de ${sale.status} para ${newStatus}.`,
					400,
				);
			}

			if (newStatus === SaleStatus.CANCELADA) {
				await this.restockItems(manager, items);

				// Uma proposta pendente deixa de valer quando o vendedor cancela o pedido
				await manager.update(
					SaleAdjustment,
					{ sale_id: sale.id, status: SaleAdjustmentStatus.PENDENTE },
					{ status: SaleAdjustmentStatus.RECUSADO, responded_at: new Date() },
				);
			}

			sale.status = newStatus;
			await manager.save(sale);
			await this.recordStatusChange(manager, sale.id, newStatus, sellerUserId);
		});

		// Retorna o pedido atualizado com a perspectiva do vendedor
		const updatedOrders = await this.getSellerOrders(sellerUserId);
		const targetOrder = updatedOrders.find((order) => order.id === saleId);
		if (!targetOrder) {
			throw new AppError("Pedido não encontrado após atualização.", 404);
		}
		return targetOrder;
	}

	/**
	 * Bloqueia a linha do pedido até o fim da transação. O lock é feito sem joins porque o
	 * PostgreSQL não aceita FOR UPDATE no lado anulável de um LEFT JOIN.
	 */
	private lockSale(manager: EntityManager, saleId: string) {
		return manager
			.createQueryBuilder(Sale, "sale")
			.setLock("pessimistic_write")
			.where("sale.id = :saleId", { saleId })
			.getOne();
	}

	/**
	 * Devolve ao estoque a quantidade de cada item, com lock pessimista no produto.
	 * Os produtos são bloqueados em ordem de ID para evitar deadlock entre transações.
	 */
	private async restockItems(manager: EntityManager, items: SaleProduct[]) {
		const sortedItems = [...items].sort((a, b) =>
			a.product_id.localeCompare(b.product_id),
		);

		for (const item of sortedItems) {
			const product = await manager
				.createQueryBuilder(Product, "product")
				.setLock("pessimistic_write")
				.where("product.id = :id", { id: item.product_id })
				.getOne();

			if (product) {
				product.stock = Number(
					(Number(product.stock) + Number(item.quantity)).toFixed(3),
				);
				await manager.save(product);
			}
		}
	}

	// Itens do pedido que pertencem ao vendedor, com o subtotal da parte dele
	private formatSellerItems(
		sale: Sale,
		sellerId: string,
	): { items: FormattedSaleItem[]; subtotal: number } {
		let subtotal = 0;
		const items = (sale.items || [])
			.filter((item) => item.product?.seller_id === sellerId)
			.map((item) => {
				const unitPrice = Number(item.unit_price);
				const quantity = Number(item.quantity);
				const itemTotal = Number((unitPrice * quantity).toFixed(2));
				subtotal += itemTotal;

				return {
					id: item.id,
					product_id: item.product_id,
					product_name: item.product?.name || "Produto",
					product_image: item.product?.image_url || null,
					measurement_unit:
						item.product?.measurement_unit?.symbol ||
						item.product?.measurement_unit?.name ||
						null,
					quantity,
					unit_price: unitPrice,
					total: itemTotal,
				};
			});

		return { items, subtotal: Number(subtotal.toFixed(2)) };
	}

	// Dados do cliente que o vendedor pode ver (contato e entrega, sem dados sensíveis)
	private formatSellerCustomer(sale: Sale): FormattedSellerOrder["customer"] {
		return {
			id: sale.customer.id,
			name: sale.customer.name,
			email: sale.customer.email,
			phone: sale.customer.phone || null,
			address: sale.customer.address || null,
			neighborhood: sale.customer.neighborhood?.name || null,
		};
	}

	/**
	 * Proposta de ajuste com os valores atuais e os propostos de cada item, e o total que o
	 * pedido terá se o cliente aceitar (o frete não muda).
	 */
	private formatAdjustment(
		adjustment: SaleAdjustment,
		currentOrderTotal: number,
	): FormattedSaleAdjustment {
		let difference = 0;
		const items = (adjustment.items || []).map((item) => {
			const originalQuantity = Number(item.original_quantity);
			const proposedQuantity = Number(item.proposed_quantity);
			const originalUnitPrice = Number(item.original_unit_price);
			const proposedUnitPrice = Number(item.proposed_unit_price);
			const originalTotal = Number(
				(originalQuantity * originalUnitPrice).toFixed(2),
			);
			const proposedTotal = Number(
				(proposedQuantity * proposedUnitPrice).toFixed(2),
			);
			difference += proposedTotal - originalTotal;

			return {
				id: item.id,
				sale_product_id: item.sale_product_id,
				product_id: item.sale_product?.product_id || null,
				product_name: item.sale_product?.product?.name || "Produto",
				original_quantity: originalQuantity,
				proposed_quantity: proposedQuantity,
				original_unit_price: originalUnitPrice,
				proposed_unit_price: proposedUnitPrice,
				original_total: originalTotal,
				proposed_total: proposedTotal,
			};
		});

		return {
			id: adjustment.id,
			reason: adjustment.reason,
			status: adjustment.status,
			previous_status: adjustment.previous_status,
			created_at: adjustment.created_at,
			items,
			current_order_total: Number(currentOrderTotal.toFixed(2)),
			proposed_order_total: Number((currentOrderTotal + difference).toFixed(2)),
		};
	}

	// Registra uma entrada na linha do tempo do pedido
	private async recordStatusChange(
		manager: EntityManager,
		saleId: string,
		status: SaleStatus,
		changedById: string,
	) {
		await manager.insert(SaleStatusHistory, {
			sale_id: saleId,
			status,
			changed_by_id: changedById,
		});
	}

	private formatPurchase(sale: Sale): FormattedPurchase {
		return {
			id: sale.id,
			delivery_type: sale.delivery_type,
			status: sale.status,
			total_amount: Number(sale.total_amount),
			created_at: sale.created_at,
			updated_at: sale.updated_at,
			payments: (sale.payments || []).map((p) => ({
				id: p.id,
				amount: Number(p.amount),
				payment_method: p.payment_method?.description || null,
			})),
			items: (sale.items || []).map((item) => {
				const unitPrice = Number(item.unit_price);
				const quantity = Number(item.quantity);
				return {
					id: item.id,
					product_id: item.product_id,
					product_name: item.product?.name || "Produto",
					product_image: item.product?.image_url || null,
					measurement_unit:
						item.product?.measurement_unit?.symbol ||
						item.product?.measurement_unit?.name ||
						null,
					quantity,
					unit_price: unitPrice,
					total: Number((unitPrice * quantity).toFixed(2)),
					seller: item.product?.seller?.user
						? {
								id: item.product.seller.user.id,
								name: item.product.seller.user.name,
								phone: item.product.seller.user.phone,
							}
						: null,
				};
			}),
		};
	}
}

export const saleService = new SaleService();
