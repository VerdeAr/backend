import { Not } from "typeorm";
import { AppDataSource } from "@/config/database";
import { Message } from "@/entities/Message";

export const messageRepository = AppDataSource.getRepository(Message).extend({
	async findByChatId(
		chatId: string,
		limit = 50,
		page = 1,
		order: "ASC" | "DESC" = "DESC",
	): Promise<[Message[], number]> {
		const skip = (page - 1) * limit;
		return this.findAndCount({
			where: { chat_id: chatId },
			relations: { sender: true },
			order: { created_at: order },
			take: limit,
			skip,
		});
	},

	async markAsRead(chatId: string, excludedSenderId: string): Promise<number> {
		const result = await this.createQueryBuilder()
			.update(Message)
			.set({ is_read: true })
			.where(
				"chat_id = :chatId AND sender_id != :excludedSenderId AND is_read = false",
				{
					chatId,
					excludedSenderId,
				},
			)
			.execute();

		return result.affected ?? 0;
	},

	async countUnread(chatId: string, userId: string): Promise<number> {
		return this.count({
			where: {
				chat_id: chatId,
				sender_id: Not(userId),
				is_read: false,
			},
		});
	},

	async countTotalUnread(userId: string): Promise<number> {
		const qb = this.createQueryBuilder("message")
			.innerJoin("message.chat", "chat")
			.leftJoin("chat.seller", "seller")
			.where("(chat.customer_id = :userId OR seller.user_id = :userId)", {
				userId,
			})
			.andWhere("message.sender_id != :userId", { userId })
			.andWhere("message.is_read = false");

		return qb.getCount();
	},
});
