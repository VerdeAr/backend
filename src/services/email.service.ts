import process from "node:process";
import { Resend } from "resend";

// Remetente usado quando EMAIL_FROM não está definido (domínio de testes do Resend)
const DEFAULT_FROM = "VerdeAr <onboarding@resend.dev>";

// Intervalo mínimo entre envios: 500 ms mantém até 2 e-mails por segundo, dentro do
// limite de requisições por segundo do Resend mesmo com vários checkouts ao mesmo tempo
const DEFAULT_SEND_INTERVAL_MS = 500;

function sendIntervalMs(): number {
	const raw = process.env.EMAIL_SEND_INTERVAL_MS;
	if (raw === undefined || raw.trim() === "") return DEFAULT_SEND_INTERVAL_MS;
	const value = Number(raw);
	return Number.isFinite(value) && value >= 0
		? value
		: DEFAULT_SEND_INTERVAL_MS;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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
 *
 * Os envios de `dispatch` passam por uma fila única do processo: saem um de cada vez, com
 * EMAIL_SEND_INTERVAL_MS entre eles, para não estourar o limite por segundo do Resend.
 */
export class EmailService {
	private client: Resend | null = null;
	private clientKey: string | null = null;
	private warnedMissingKey = false;
	private queue: Promise<void> = Promise.resolve();
	private lastSentAt = 0;

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
	 * Coloca o envio na fila, sem atrasar a resposta da requisição.
	 * Deve ser chamado só depois que a transação do banco foi confirmada.
	 */
	dispatch(
		event: EmailEvent,
		message: EmailMessage,
		context: EmailLogContext = {},
	): void {
		this.queue = this.queue
			.then(() => this.sendInOrder(event, message, context))
			.catch((error: unknown) => {
				// `send` não lança erro; isto só protege a fila de uma falha inesperada
				logEmailFailure(
					event,
					context,
					error instanceof Error ? error.message : "erro inesperado na fila",
				);
			});
	}

	// Resolve quando todos os e-mails colocados na fila até agora foram processados
	idle(): Promise<void> {
		return this.queue;
	}

	private async sendInOrder(
		event: EmailEvent,
		message: EmailMessage,
		context: EmailLogContext,
	): Promise<void> {
		// Sem chave nada sai para o Resend, então não há por que esperar o intervalo
		const willCallResend = Boolean(process.env.RESEND_API_KEY);
		if (willCallResend) {
			const wait = this.lastSentAt + sendIntervalMs() - Date.now();
			if (wait > 0) await delay(wait);
		}

		await this.send(event, message, context);

		if (willCallResend) this.lastSentAt = Date.now();
	}
}

export const emailService = new EmailService();
