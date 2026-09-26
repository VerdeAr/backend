import { AppDataSource } from "@/config/database";
import {
	Cart,
	CartItem,
	DeliveryType,
	Payment,
	PaymentMethod,
	Product,
	Sale,
	SaleProduct,
	SaleStatus,
} from "@/entities";
import { AppError } from "@/errors/AppError";
import type { CheckoutInput } from "@/schemas/sale.schema";

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
}

export const saleService = new SaleService();
