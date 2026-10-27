import type http from "node:http";
import process from "node:process";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import { type Socket, Server as SocketIOServer } from "socket.io";
import { ZodError } from "zod";
import type { UserRole } from "@/entities/enums";
import { AppError } from "@/errors/AppError";
import {
	socketChatIdSchema,
	socketSendMessageSchema,
	socketTypingSchema,
} from "@/schemas/chat.schema";
import { chatService } from "@/services/chat.service";

export interface AuthenticatedUser {
	userId: string;
	role: UserRole;
}

export interface CustomSocket extends Socket {
	data: {
		user?: AuthenticatedUser;
	};
}

let ioInstance: SocketIOServer | null = null;

function getSocketErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof AppError) {
		return error.message;
	}
	if (error instanceof ZodError) {
		return error.issues[0]?.message || "Dados inválidos.";
	}
	return fallback;
}

export function initSocketServer(httpServer: http.Server): SocketIOServer {
	const allowedOrigins: string[] = process.env.CORS_ORIGIN
		? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
		: [
				"http://localhost:5173",
				"http://localhost:3000",
				"http://127.0.0.1:5173",
			];

	const io = new SocketIOServer(httpServer, {
		cors: {
			origin: allowedOrigins,
			credentials: true,
			methods: ["GET", "POST"],
		},
	});

	// Middleware de Handshake: Autenticação via JWT (Cookies HTTP-Only ou Header Authorization)
	io.use((socket: CustomSocket, next) => {
		let token: string | undefined;

		// 1. Extração via cookie HTTP
		const rawCookie = socket.handshake.headers.cookie;
		if (rawCookie) {
			const parsed = parseCookie(rawCookie);
			token = parsed.token || parsed.auth_token;
		}

		// 2. Extração via auth payload (socket = io({ auth: { token } }))
		if (!token && socket.handshake.auth?.token) {
			token = String(socket.handshake.auth.token);
		}

		// 3. Fallback: Header Authorization Bearer
		if (!token && socket.handshake.headers.authorization) {
			const parts = socket.handshake.headers.authorization.split(" ");
			if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
				token = parts[1];
			}
		}

		if (!token) {
			return next(new Error("Não autorizado: token JWT ausente."));
		}

		try {
			const secret = process.env.JWT_SECRET;
			if (!secret) {
				return next(
					new Error("Não autorizado: segredo JWT não configurado no servidor."),
				);
			}
			const decoded = jwt.verify(token, secret) as {
				id: string;
				role: UserRole;
			};
			socket.data.user = {
				userId: decoded.id,
				role: decoded.role,
			};
			return next();
		} catch {
			return next(new Error("Não autorizado: token JWT inválido ou expirado."));
		}
	});

	io.on("connection", (socket: CustomSocket) => {
		const user = socket.data.user;
		if (!user) {
			socket.disconnect(true);
			return;
		}

		// Ingressa em uma sala privada com o id do próprio usuário para notificações diretas
		socket.join(`user:${user.userId}`);

		// Evento: Entrar na sala de um chat específico (valida participação)
		socket.on(
			"join_chat",
			async (
				data: unknown,
				callback?: (res: {
					success: boolean;
					error?: string;
					room?: string;
				}) => void,
			) => {
				try {
					const { chat_id } = socketChatIdSchema.parse(data);

					await chatService.validarParticipante(chat_id, user.userId);
					const room = `chat:${chat_id}`;
					socket.join(room);
					callback?.({ success: true, room });
				} catch (error: unknown) {
					callback?.({
						success: false,
						error: getSocketErrorMessage(
							error,
							"Erro ao entrar na sala do chat.",
						),
					});
				}
			},
		);

		// Evento: Sair da sala do chat
		socket.on("leave_chat", (data: unknown) => {
			const parsed = socketChatIdSchema.safeParse(data);
			if (parsed.success) {
				socket.leave(`chat:${parsed.data.chat_id}`);
			}
		});

		// Evento: Enviar mensagem com persistência no banco (RN-47 e RN-48)
		socket.on(
			"send_message",
			async (
				data: unknown,
				callback?: (res: {
					success: boolean;
					error?: string;
					message?: unknown;
				}) => void,
			) => {
				try {
					const { chat_id, content } = socketSendMessageSchema.parse(data);

					const saved = await chatService.salvarMensagem(
						chat_id,
						user.userId,
						content,
					);

					const payload = {
						id: saved.id,
						chat_id: saved.chat_id,
						sender_id: saved.sender_id,
						sender_name: saved.sender?.name,
						content: saved.content,
						is_read: saved.is_read,
						created_at: saved.created_at,
					};

					// Notifica todos na sala do chat
					io.to(`chat:${chat_id}`).emit("new_message", payload);

					callback?.({ success: true, message: payload });
				} catch (error: unknown) {
					callback?.({
						success: false,
						error: getSocketErrorMessage(error, "Erro ao enviar mensagem."),
					});
				}
			},
		);

		// Evento: Indicador de digitação (valida se o socket está na sala)
		socket.on("typing_indicator", (data: unknown) => {
			const parsed = socketTypingSchema.safeParse(data);
			if (!parsed.success) return;

			const room = `chat:${parsed.data.chat_id}`;
			if (!socket.rooms.has(room)) {
				return;
			}

			socket.to(room).emit("user_typing", {
				chat_id: parsed.data.chat_id,
				userId: user.userId,
				is_typing: parsed.data.is_typing,
			});
		});

		// Evento: Leitura de mensagens
		socket.on(
			"message_read",
			async (
				data: unknown,
				callback?: (res: {
					success: boolean;
					count?: number;
					error?: string;
				}) => void,
			) => {
				try {
					const { chat_id } = socketChatIdSchema.parse(data);

					const count = await chatService.marcarMensagensLidas(
						chat_id,
						user.userId,
					);
					socket.to(`chat:${chat_id}`).emit("messages_read", {
						chat_id,
						readBy: user.userId,
						count,
					});
					callback?.({ success: true, count });
				} catch (error: unknown) {
					callback?.({
						success: false,
						error: getSocketErrorMessage(
							error,
							"Erro ao marcar mensagens como lidas.",
						),
					});
				}
			},
		);
	});

	ioInstance = io;
	return io;
}

export function getIO(): SocketIOServer {
	if (!ioInstance) {
		throw new Error("Socket.IO não foi inicializado.");
	}
	return ioInstance;
}
