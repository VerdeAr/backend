import { AppDataSource } from "@/config/database";
import { CartItem } from "@/entities/CartItem";

export const cartItemRepository = AppDataSource.getRepository(CartItem).extend({
	async findByIdWithCart(id: string): Promise<CartItem | null> {
		return this.createQueryBuilder("item")
			.leftJoinAndSelect("item.cart", "cart")
			.leftJoinAndSelect("item.product", "product")
			.where("item.id = :id", { id })
			.getOne();
	},

	async findByCartAndProduct(
		cartId: string,
		productId: string,
	): Promise<CartItem | null> {
		return this.findOne({
			where: {
				cart_id: cartId,
				product_id: productId,
			},
			relations: { product: true },
		});
	},
});
