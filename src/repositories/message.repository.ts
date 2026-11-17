import { Not } from "typeorm";
import { AppDataSource } from "@/config/database";
import { Message } from "@/entities/Message";

export const messageRepository = AppDataSource.getRepository(Message).extend({
	/**
	 * Consulta base da mensagem com o remetente reduzido a `id` e `name` (VER-108).
	 * Nunca use `relations: { sender: true }`: isso devolveria os dados pessoais do remetente.
	 */
	withSender() {
		return this.createQueryBuilder("message")
			.leftJoin("message.sender", "sender")
			.addSelect(["sender.id", "sender.name"]);
	},

	async findByChatId(
		chatId: string,
		limit = 50,
		page = 1,
		order: "ASC" | "DESC" = "DESC",
	): Promise<[Message[], number]> {
		const skip = (page - 1) * limit;
		return this.withSender()
			.where("message.chat_id = :chatId", { chatId })
			.orderBy("message.created_at", order)
			.skip(skip)
			.take(limit)
			.getManyAndCount();
	},

	async findByIdWithSender(messageId: string): Promise<Message | null> {
		return this.withSender()
			.where("message.id = :messageId", { messageId })
			.getOne();
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
