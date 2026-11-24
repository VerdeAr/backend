import process from "node:process";
import { Resend } from "resend";

// Remetente usado quando EMAIL_FROM não está definido (domínio de testes do Resend)
const DEFAULT_FROM = "VerdeAr <onboarding@resend.dev>";

// Eventos transacionais cobertos pela VER-82, usados para identificar o envio no log
export type EmailEvent =
	| "boas-vindas"
	| "confirmacao-pedido"
	| "novo-pedido-produtor"
	| "status-pedido";

export interface EmailMessage {
	to: string;
	subject: string;
	html: string;
	// Versão em texto puro, para clientes de e-mail sem HTML e para reduzir a chance de spam
	text: string;
}

// Identificadores do registro de origem (usuário, pedido), registrados no log em vez do e-mail
export type EmailLogContext = Record<string, string>;

function describeContext(context: EmailLogContext): string {
	const entries = Object.entries(context);
	if (entries.length === 0) return "";
	return ` (${entries.map(([key, value]) => `${key}=${value}`).join(", ")})`;
}

function logEmailFailure(
	event: EmailEvent,
	context: EmailLogContext,
	detail: string,
): void {
	console.error(
		`[Resend] Falha ao enviar o e-mail "${event}"${describeContext(context)}: ${detail}`,
	);
}

/**
 * Serviço centralizado de e-mails transacionais (VER-83).
 *
 * O e-mail é um efeito colateral: uma falha no envio nunca desfaz nem quebra a operação que
 * o disparou (cadastro, checkout, mudança de status). Por isso `send` não lança erros; toda
 * falha é registrada no log com o evento e os IDs envolvidos, sem o endereço do destinatário.
 *
 * Sem RESEND_API_KEY (desenvolvimento, testes e CI), nenhum e-mail é enviado, o que também
 * preserva a cota gratuita do Resend (RNF-23).
 */
export class EmailService {
	private client: Resend | null = null;
	private clientKey: string | null = null;
	private warnedMissingKey = false;

	// A chave é lida a cada envio, para refletir o ambiente atual (inclusive nos testes)
	private getClient(): Resend | null {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) return null;

		if (!this.client || this.clientKey !== apiKey) {
			this.client = new Resend(apiKey);
			this.clientKey = apiKey;
		}
		return this.client;
	}

	/**
	 * Envia um e-mail e informa se ele foi aceito pelo Resend. Nunca lança erro.
	 */
	async send(
		event: EmailEvent,
		message: EmailMessage,
		context: EmailLogContext = {},
	): Promise<boolean> {
		const client = this.getClient();
		if (!client) {
			// Avisa uma única vez, para não poluir o log a cada cadastro ou pedido
			if (!this.warnedMissingKey) {
				console.warn(
					"[Resend] RESEND_API_KEY não configurada: os e-mails transacionais não serão enviados.",
				);
				this.warnedMissingKey = true;
			}
			return false;
		}

		try {
			const { error } = await client.emails.send({
				from: process.env.EMAIL_FROM || DEFAULT_FROM,
				to: message.to,
				subject: message.subject,
				html: message.html,
				text: message.text,
			});

			if (error) {
				logEmailFailure(
					event,
					context,
					`${error.name} (${error.statusCode ?? "sem status"}): ${error.message}`,
				);
				return false;
			}

			return true;
		} catch (error) {
			const detail =
				error instanceof Error ? error.message : "serviço inacessível";
			logEmailFailure(event, context, detail);
			return false;
		}
	}

	/**
	 * Dispara o envio em segundo plano, sem atrasar a resposta da requisição.
	 * Deve ser chamado só depois que a transação do banco foi confirmada.
	 */
	dispatch(
		event: EmailEvent,
		message: EmailMessage,
		context: EmailLogContext = {},
	): void {
		void this.send(event, message, context);
	}
}

export const emailService = new EmailService();
