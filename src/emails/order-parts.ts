import { escapeHtml, formatCurrency } from "@/emails/layout";
import { DeliveryType, SaleStatus } from "@/entities/enums";

// Item de pedido já calculado pelo SaleService; os templates só exibem os valores
export interface OrderEmailItem {
	name: string;
	quantity: number;
	unit: string | null;
	unitPrice: number;
	total: number;
}

// Linha de resumo abaixo dos itens (subtotal, frete, total)
export interface OrderEmailSummaryLine {
	label: string;
	value: number;
	bold?: boolean;
}

// Mesmo formato exibido no frontend: "Pedido #1A2B3C4D"
export function shortOrderId(saleId: string): string {
	return saleId.slice(0, 8).toUpperCase();
}

// Rótulos iguais aos do frontend (`lib/sale-status.ts`), na visão do cliente
export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
	[SaleStatus.ABERTA]: "Recebido",
	[SaleStatus.EM_PREPARACAO]: "Em preparação",
	[SaleStatus.A_CAMINHO]: "A caminho",
	[SaleStatus.AGUARDANDO_APROVACAO_CLIENTE]: "Aguardando sua aprovação",
	[SaleStatus.FINALIZADA]: "Concluído",
	[SaleStatus.CANCELADA]: "Cancelado",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
	[DeliveryType.ENTREGA]: "Entrega no endereço",
	[DeliveryType.RETIRADA]: "Retirada com o produtor",
};

function formatQuantity(item: OrderEmailItem): string {
	const quantity = new Intl.NumberFormat("pt-BR", {
		maximumFractionDigits: 3,
	}).format(item.quantity);
	return item.unit ? `${quantity} ${item.unit}` : quantity;
}

const CELL = "padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;";

/**
 * Tabela de itens com o resumo de valores. Duas colunas, para caber em telas de 320 px.
 */
export function renderItemsTable(
	items: OrderEmailItem[],
	summary: OrderEmailSummaryLine[],
): string {
	const rows = items
		.map(
			(item) => `<tr>
<td style="${CELL}color:#1f2937;">${escapeHtml(item.name)}<br><span style="color:#6b7280;">${escapeHtml(formatQuantity(item))} × ${escapeHtml(formatCurrency(item.unitPrice))}</span></td>
<td align="right" style="${CELL}color:#1f2937;white-space:nowrap;">${escapeHtml(formatCurrency(item.total))}</td>
</tr>`,
		)
		.join("\n");

	const summaryRows = summary
		.map((line) => {
			const weight = line.bold ? "font-weight:bold;" : "";
			return `<tr>
<td style="padding:6px 0;font-size:14px;color:#1f2937;${weight}">${escapeHtml(line.label)}</td>
<td align="right" style="padding:6px 0;font-size:14px;color:#1f2937;white-space:nowrap;${weight}">${escapeHtml(formatCurrency(line.value))}</td>
</tr>`;
		})
		.join("\n");

	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
${rows}
${summaryRows}
</table>`;
}

// Versão em texto puro da tabela de itens
export function itemsText(
	items: OrderEmailItem[],
	summary: OrderEmailSummaryLine[],
): string[] {
	return [
		...items.map(
			(item) =>
				`- ${item.name}: ${formatQuantity(item)} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}`,
		),
		...summary.map((line) => `${line.label}: ${formatCurrency(line.value)}`),
	];
}

// Bloco destacado (instruções de entrega, pagamento, contato), com texto já escapado
export function renderInfoBox(title: string, linesHtml: string[]): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;background:#f0fdf4;border-radius:6px;">
<tr><td style="padding:12px 16px;font-size:14px;line-height:22px;color:#1f2937;">
<strong>${escapeHtml(title)}</strong><br>
${linesHtml.join("<br>\n")}
</td></tr>
</table>`;
}
