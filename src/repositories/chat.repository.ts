import { AppDataSource } from "@/config/database";
import { Chat } from "@/entities/Chat";
import { ChatStatus } from "@/entities/enums";

export const chatRepository = AppDataSource.getRepository(Chat).extend({
	async findActiveChat(
		customerId: string,
		sellerId: string,
	): Promise<Chat | null> {
		return this.findOne({
			where: {
				customer_id: customerId,
				seller_id: sellerId,
				status: ChatStatus.ATIVO,
			},
			relations: { customer: true, seller: { user: true } },
		});
	},

	async findChatById(chatId: string): Promise<Chat | null> {
		return this.findOne({
			where: { id: chatId },
			relations: { customer: true, seller: { user: true } },
		});
	},

	async findUserChats(userId: string, sellerId?: string): Promise<Chat[]> {
		const qb = this.createQueryBuilder("chat")
			.leftJoinAndSelect("chat.customer", "customer")
			.leftJoinAndSelect("chat.seller", "seller")
			.leftJoinAndSelect("seller.user", "sellerUser")
			.orderBy("chat.last_message_at", "DESC", "NULLS LAST")
			.addOrderBy("chat.created_at", "DESC");

		if (sellerId) {
			qb.where("chat.customer_id = :userId OR chat.seller_id = :sellerId", {
				userId,
				sellerId,
			});
		} else {
			qb.where("chat.customer_id = :userId", { userId });
		}

		return qb.getMany();
	},
});
