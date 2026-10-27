import type { Chat } from "@/entities/Chat";
import { ChatStatus, type UserRole } from "@/entities/enums";
import type { Message } from "@/entities/Message";
import type { Seller } from "@/entities/Seller";
import { AppError } from "@/errors/AppError";
import {
	chatRepository,
	messageRepository,
	productRepository,
	saleRepository,
	sellerRepository,
} from "@/repositories";

export interface IniciarChatParams {
	userId: string;
	userRole: UserRole;
	sellerId?: string;
	productId?: string;
	saleId?: string;
}

export interface ChatParticipantValidation {
	chat: Chat;
	isCustomer: boolean;
	isSeller: boolean;
}

export class ChatService {
	/**
	 * Inicia ou localiza um chat ativo entre cliente e vendedor.
	 * Regras de negócio (RN-47 e RN-48):
	 * - Exclusivo entre um Cliente e um Vendedor.
	 * - Não é permitido iniciar chat consigo mesmo.
	 * - Vendedores também compram (RN-08): qualquer usuário autenticado pode iniciar chat
	 *   com um vendedor a partir de seller_id ou product_id (atuando como comprador).
	 * - Em chats iniciados por sale_id, valida que o solicitante participa da venda
	 *   (seja como comprador ou vendedor) e trata vendas com múltiplos vendedores.
	 */
	async iniciarChat({
		userId,
		userRole: _userRole,
		sellerId,
		productId,
		saleId,
	}: IniciarChatParams): Promise<Chat> {
		let finalSellerId: string | null = null;
		let customerId = userId;

		if (sellerId) {
			const seller = await sellerRepository.findOne({
				where: { id: sellerId },
				relations: { user: true },
			});
			if (!seller) {
				throw new AppError("Vendedor não encontrado.", 404);
			}
			finalSellerId = seller.id;
			if (seller.user_id === userId) {
				throw new AppError("Você não pode iniciar um chat consigo mesmo.", 400);
			}
		} else if (productId) {
			const product = await productRepository.findOne({
				where: { id: productId },
				relations: { seller: { user: true } },
			});
			if (!product?.seller) {
				throw new AppError(
					"Produto não encontrado ou sem vendedor associado.",
					404,
				);
			}
			finalSellerId = product.seller.id;
			if (product.seller.user_id === userId) {
				throw new AppError("Você não pode iniciar um chat consigo mesmo.", 400);
			}
		} else if (saleId) {
			const sale = await saleRepository.findOne({
				where: { id: saleId },
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

			if (!sale?.items?.length) {
				throw new AppError(
					"Venda não encontrada ou sem itens associados.",
					404,
				);
			}

			// Mapeia vendedores únicos participantes dos itens da venda
			const sellersMap = new Map<string, Seller>();
			for (const item of sale.items) {
				if (item.product?.seller) {
					sellersMap.set(item.product.seller.id, item.product.seller);
				}
			}
			const sellersInSale = Array.from(sellersMap.values());

			if (sellersInSale.length === 0) {
				throw new AppError(
					"Venda não possui vendedores associados aos itens.",
					404,
				);
			}

			const isCustomer = sale.customer_id === userId;
			const sellerParticipant = sellersInSale.find((s) => s.user_id === userId);

			if (!isCustomer && !sellerParticipant) {
				throw new AppError(
					"Acesso negado: você não participa desta venda.",
					403,
				);
			}

			if (isCustomer) {
				customerId = userId;
				if (sellerId) {
					const chosen = sellersMap.get(sellerId);
					if (!chosen) {
						throw new AppError(
							"O vendedor informado não possui produtos nesta venda.",
							400,
						);
					}
					finalSellerId = chosen.id;
				} else if (sellersInSale.length === 1) {
					finalSellerId = sellersInSale[0].id;
				} else {
					throw new AppError(
						"A venda possui múltiplos vendedores. Informe seller_id para selecionar o vendedor desejado.",
						400,
					);
				}
			} else if (sellerParticipant) {
				finalSellerId = sellerParticipant.id;
				customerId = sale.customer_id;
			}

			if (finalSellerId && customerId) {
				const targetSeller = sellersMap.get(finalSellerId);
				if (targetSeller && targetSeller.user_id === customerId) {
					throw new AppError(
						"Você não pode iniciar um chat consigo mesmo.",
						400,
					);
				}
			}
		} else {
			throw new AppError(
				"Informe seller_id, product_id ou sale_id para iniciar o chat.",
				400,
			);
		}

		if (!finalSellerId) {
			throw new AppError(
				"Não foi possível identificar o vendedor do chat.",
				400,
			);
		}

		// RN-48: reaproveita chat ativo pré-existente entre o cliente e o vendedor
		const existingChat = await chatRepository.findActiveChat(
			customerId,
			finalSellerId,
		);
		if (existingChat) {
			return existingChat;
		}

		const newChat = chatRepository.create({
			customer_id: customerId,
			seller_id: finalSellerId,
			status: ChatStatus.ATIVO,
			last_message_at: null,
		});

		const saved = await chatRepository.save(newChat);
		const fullChat = await chatRepository.findChatById(saved.id);
		return fullChat ?? saved;
	}

	/**
	 * Valida se o usuário autenticado faz parte do chat.
	 */
	async validarParticipante(
		chatId: string,
		userId: string,
	): Promise<ChatParticipantValidation> {
		const chat = await chatRepository.findChatById(chatId);
		if (!chat) {
			throw new AppError("Chat não encontrado.", 404);
		}

		const isCustomer = chat.customer_id === userId;
		const isSeller = chat.seller?.user_id === userId;

		if (!isCustomer && !isSeller) {
			throw new AppError(
				"Acesso negado: você não participa desta conversa.",
				403,
			);
		}

		return { chat, isCustomer, isSeller };
	}

	/**
	 * Salva uma nova mensagem no chat, validando se o chat está ativo (RN-48).
	 */
	async salvarMensagem(
		chatId: string,
		senderId: string,
		conteudo: string,
	): Promise<Message> {
		const cleanContent = conteudo?.trim();
		if (!cleanContent) {
			throw new AppError("O conteúdo da mensagem não pode ser vazio.", 400);
		}

		const { chat } = await this.validarParticipante(chatId, senderId);

		// RN-48: Um chat pode estar Ativo ou Finalizado. Não aceita mensagens se finalizado.
		if (chat.status === ChatStatus.FINALIZADO) {
			throw new AppError(
				"Este chat está finalizado e não aceita novas mensagens.",
				400,
			);
		}

		const message = messageRepository.create({
			chat_id: chatId,
			sender_id: senderId,
			content: cleanContent,
			is_read: false,
		});

		const savedMessage = await messageRepository.save(message);

		chat.last_message_at = savedMessage.created_at;
		await chatRepository.save(chat);

		const messageWithSender = await messageRepository.findOne({
			where: { id: savedMessage.id },
			relations: { sender: true },
		});

		return messageWithSender ?? savedMessage;
	}

	/**
	 * Lista as mensagens de um chat com paginação.
	 */
	async listarMensagens(
		chatId: string,
		userId: string,
		limit = 50,
		page = 1,
	): Promise<{
		messages: Message[];
		total: number;
		page: number;
		limit: number;
	}> {
		await this.validarParticipante(chatId, userId);
		const [messages, total] = await messageRepository.findByChatId(
			chatId,
			limit,
			page,
		);

		return { messages, total, page, limit };
	}

	/**
	 * Lista todos os chats do usuário autenticado (como cliente ou como vendedor).
	 */
	async listarChatsDoUsuario(userId: string): Promise<Chat[]> {
		const seller = await sellerRepository.findOne({
			where: { user_id: userId },
		});
		return chatRepository.findUserChats(userId, seller?.id);
	}

	/**
	 * Marca como lidas todas as mensagens recebidas pelo usuário no chat.
	 */
	async marcarMensagensLidas(chatId: string, userId: string): Promise<number> {
		await this.validarParticipante(chatId, userId);
		return messageRepository.markAsRead(chatId, userId);
	}

	/**
	 * Encerra o chat alterando o status para FINALIZADO (RN-48).
	 */
	async finalizarChat(chatId: string, userId: string): Promise<Chat> {
		const { chat } = await this.validarParticipante(chatId, userId);
		chat.status = ChatStatus.FINALIZADO;
		return chatRepository.save(chat);
	}
}

export const chatService = new ChatService();
