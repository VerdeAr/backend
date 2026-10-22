import { Not } from "typeorm";
import { AppDataSource } from "@/config/database";
import { Message } from "@/entities/Message";

export const messageRepository = AppDataSource.getRepository(Message).extend({
	async findByChatId(
		chatId: string,
		limit = 50,
		page = 1,
	): Promise<[Message[], number]> {
		const skip = (page - 1) * limit;
		return this.findAndCount({
			where: { chat_id: chatId },
			relations: { sender: true },
			order: { created_at: "ASC" },
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
});
