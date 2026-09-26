import { AppDataSource } from "@/config/database";
import { Cart } from "@/entities/Cart";

export const cartRepository = AppDataSource.getRepository(Cart).extend({
	async findByUserId(userId: string): Promise<Cart | null> {
		return this.createQueryBuilder("cart")
			.leftJoinAndSelect("cart.items", "items")
			.leftJoinAndSelect("items.product", "product")
			.leftJoinAndSelect("product.category", "category")
			.leftJoinAndSelect("product.measurement_unit", "measurement_unit")
			.leftJoinAndSelect("product.seller", "seller")
			.leftJoin("seller.user", "user")
			.addSelect(["user.id", "user.name", "user.fixed_shipping_rate"])
			.where("cart.user_id = :userId", { userId })
			.orderBy("items.created_at", "ASC")
			.getOne();
	},

	async getOrCreate(userId: string): Promise<Cart> {
		let cart = await this.findByUserId(userId);
		if (!cart) {
			const newCart = this.create({
				user_id: userId,
				items: [],
			});
			await this.save(newCart);
			cart = await this.findByUserId(userId);
		}
		return cart!;
	},
});
