import type { NextFunction, Request, Response } from "express";
import {
	chatIdParamSchema,
	iniciarChatSchema,
	listMessagesQuerySchema,
	sendMessageSchema,
} from "@/schemas/chat.schema";
import { chatService } from "@/services/chat.service";
import { getIO } from "@/websocket/socket.server";

export class ChatController {
	/**
	 * POST /chats
	 * Inicia ou localiza um chat ativo entre cliente e vendedor.
	 */
	async iniciar(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const userRole = req.user!.role;
			const data = iniciarChatSchema.parse(req.body);

			const chat = await chatService.iniciarChat({
				userId,
				userRole,
				sellerId: data.seller_id,
				productId: data.product_id,
				saleId: data.sale_id,
			});

			return res.status(201).json(chat);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /chats
	 * Lista todos os chats do usuário autenticado.
	 */
	async listar(req: Request, res: Response, next: NextFunction) {
		try {
			const userId = req.user!.id;
			const chats = await chatService.listarChatsDoUsuario(userId);
			return res.status(200).json(chats);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /chats/:id
	 * Retorna detalhes de um chat específico, validando se o usuário é participante.
	 */
	async obterPorId(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = chatIdParamSchema.parse(req.params);
			const userId = req.user!.id;
			const { chat } = await chatService.validarParticipante(id, userId);
			return res.status(200).json(chat);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * GET /chats/:id/messages
	 * Lista histórico de mensagens de um chat com paginação.
	 */
	async listarMensagens(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = chatIdParamSchema.parse(req.params);
			const { page, limit } = listMessagesQuerySchema.parse(req.query);
			const userId = req.user!.id;

			const result = await chatService.listarMensagens(id, userId, limit, page);
			return res.status(200).json(result);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * POST /chats/:id/messages
	 * Envia uma mensagem via REST (e replica no WebSocket se disponível).
	 */
	async enviarMensagem(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = chatIdParamSchema.parse(req.params);
			const { content } = sendMessageSchema.parse(req.body);
			const userId = req.user!.id;

			const message = await chatService.salvarMensagem(id, userId, content);

			try {
				const io = getIO();
				io.to(`chat:${id}`).emit("new_message", {
					id: message.id,
					chat_id: message.chat_id,
					sender_id: message.sender_id,
					sender_name: message.sender?.name,
					content: message.content,
					is_read: message.is_read,
					created_at: message.created_at,
				});
			} catch {
				// Socket.io pode não estar em execução no ambiente de testes unitários
			}

			return res.status(201).json(message);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PATCH /chats/:id/read
	 * Marca mensagens recebidas como lidas.
	 */
	async marcarLidas(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = chatIdParamSchema.parse(req.params);
			const userId = req.user!.id;

			const count = await chatService.marcarMensagensLidas(id, userId);

			try {
				const io = getIO();
				io.to(`chat:${id}`).emit("messages_read", {
					chat_id: id,
					readBy: userId,
					count,
				});
			} catch {
				// silencioso caso socket não esteja ativo
			}

			return res.status(200).json({ success: true, count });
		} catch (error) {
			next(error);
		}
	}

	/**
	 * PATCH /chats/:id/finish
	 * Encerra o chat alterando o status para FINALIZADO.
	 */
	async finalizar(req: Request, res: Response, next: NextFunction) {
		try {
			const { id } = chatIdParamSchema.parse(req.params);
			const userId = req.user!.id;

			const chat = await chatService.finalizarChat(id, userId);
			return res.status(200).json(chat);
		} catch (error) {
			next(error);
		}
	}
}
