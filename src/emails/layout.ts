import process from "node:process";

// Cores da marca, repetidas inline porque muitos clientes de e-mail ignoram <style>
const BRAND_COLOR = "#2e7d32";
const TEXT_COLOR = "#1f2937";
const MUTED_COLOR = "#6b7280";
const BACKGROUND_COLOR = "#f3f4f6";

const HTML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

/**
 * Escapa texto vindo do usuário (nome, produto, endereço) antes de inseri-lo no HTML,
 * para que ninguém injete marcação ou links nos e-mails enviados pela plataforma.
 */
export function escapeHtml(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return "";
	return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Monta um link absoluto para o frontend a partir de APP_URL (opcional).
 * Sem APP_URL, ou com um valor que não seja http(s), devolve null e o e-mail sai sem botão.
 */
export function appUrl(path: string): string | null {
	const base = process.env.APP_URL?.trim();
	if (!base) return null;

	try {
		const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
		if (url.protocol !== "http:" && url.protocol !== "https:") return null;
		return url.toString();
	} catch {
		return null;
	}
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

// Resultado de cada template: assunto, HTML e a versão em texto puro
export interface RenderedEmail {
	subject: string;
	html: string;
	text: string;
}

export interface EmailCallToAction {
	label: string;
	url: string;
}

export interface EmailLayoutInput {
	// Título da aba e cabeçalho do conteúdo (texto puro; é escapado aqui)
	title: string;
	// Resumo exibido pelos clientes de e-mail ao lado do assunto (texto puro)
	preheader: string;
	// Corpo já em HTML; quem monta deve escapar os dados do usuário com escapeHtml
	bodyHtml: string;
	cta?: EmailCallToAction | null;
}

// Parágrafo padrão dos templates, com o texto já escapado por quem chama
export function paragraph(html: string): string {
	return `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${TEXT_COLOR};">${html}</p>`;
}

function renderButton(cta: EmailCallToAction): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
<tr><td style="border-radius:6px;background:${BRAND_COLOR};">
<a href="${escapeHtml(cta.url)}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${escapeHtml(cta.label)}</a>
</td></tr>
</table>`;
}

/**
 * Layout base dos e-mails: tabelas e CSS inline, largura máxima de 600 px e 100% em telas
 * pequenas, que é o formato com melhor suporte entre Gmail, Outlook e clientes móveis.
 */
export function renderLayout(input: EmailLayoutInput): string {
	const button = input.cta ? renderButton(input.cta) : "";

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BACKGROUND_COLOR};font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BACKGROUND_COLOR};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;">
<tr><td style="padding:20px 24px;background:${BRAND_COLOR};border-radius:8px 8px 0 0;">
<span style="font-size:22px;font-weight:bold;color:#ffffff;">VerdeAr</span>
</td></tr>
<tr><td style="padding:24px;">
<h1 style="margin:0 0 16px;font-size:20px;line-height:28px;color:${TEXT_COLOR};">${escapeHtml(input.title)}</h1>
${input.bodyHtml}
${button}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;line-height:18px;color:${MUTED_COLOR};">
Este é um e-mail automático do VerdeAr. Não é preciso respondê-lo.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Versão em texto puro: título, linhas do corpo, link do botão (quando houver) e rodapé.
 */
export function renderText(
	title: string,
	lines: string[],
	cta?: EmailCallToAction | null,
): string {
	const parts = [title, "", ...lines];
	if (cta) parts.push("", `${cta.label}: ${cta.url}`);
	parts.push(
		"",
		"Este é um e-mail automático do VerdeAr. Não é preciso respondê-lo.",
	);
	return parts.join("\n");
}
