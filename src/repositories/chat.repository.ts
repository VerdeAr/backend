import { AppDataSource } from "@/config/database";
import { Chat } from "@/entities/Chat";
import { ChatStatus } from "@/entities/enums";

export const chatRepository = AppDataSource.getRepository(Chat).extend({
	/**
	 * Consulta base do chat com os participantes reduzidos aos campos públicos (VER-108).
	 * Nunca use `relations: { customer: true }` ou `leftJoinAndSelect` nos usuários do chat:
	 * isso devolveria senha, CPF, e-mail e telefone ao outro participante.
	 */
	withParticipants() {
		return this.createQueryBuilder("chat")
			.leftJoin("chat.customer", "customer")
			.leftJoin("chat.seller", "seller")
			.leftJoin("seller.user", "sellerUser")
			.addSelect([
				"customer.id",
				"customer.name",
				"seller.id",
				"seller.user_id",
				"seller.farm_name",
				"sellerUser.id",
				"sellerUser.name",
			]);
	},

	async findActiveChat(
		customerId: string,
		sellerId: string,
	): Promise<Chat | null> {
		return this.withParticipants()
			.where("chat.customer_id = :customerId", { customerId })
			.andWhere("chat.seller_id = :sellerId", { sellerId })
			.andWhere("chat.status = :status", { status: ChatStatus.ATIVO })
			.getOne();
	},

	async findChatById(chatId: string): Promise<Chat | null> {
		return this.withParticipants()
			.where("chat.id = :chatId", { chatId })
			.getOne();
	},

	async findUserChats(userId: string, sellerId?: string): Promise<Chat[]> {
		const qb = this.withParticipants()
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
