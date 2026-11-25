import {
	appUrl,
	escapeHtml,
	paragraph,
	type RenderedEmail,
	renderLayout,
	renderText,
} from "@/emails/layout";
import { SALE_STATUS_LABELS, shortOrderId } from "@/emails/order-parts";
import { DeliveryType, SaleStatus } from "@/entities/enums";

export interface OrderStatusEmailInput {
	customerName: string;
	saleId: string;
	status: SaleStatus;
	deliveryType: DeliveryType;
}

// Explicação de cada status para o cliente; a Retirada muda o texto de alguns deles
function statusMessage(status: SaleStatus, deliveryType: DeliveryType): string {
	const isDelivery = deliveryType === DeliveryType.ENTREGA;

	switch (status) {
		case SaleStatus.ABERTA:
			return "O pedido foi recebido pelo produtor.";
		case SaleStatus.EM_PREPARACAO:
			return isDelivery
				? "O produtor está separando os seus produtos para a entrega."
				: "O produtor está separando os seus produtos. Combine a retirada com ele.";
		case SaleStatus.A_CAMINHO:
			return "Os seus produtos saíram para entrega e devem chegar em breve.";
		case SaleStatus.AGUARDANDO_APROVACAO_CLIENTE:
			return "O produtor propôs um ajuste no pedido. Acesse as suas compras para aprovar ou recusar.";
		case SaleStatus.FINALIZADA:
			return isDelivery
				? "O pedido foi entregue. Que tal avaliar a sua compra?"
				: "O pedido foi retirado. Que tal avaliar a sua compra?";
		case SaleStatus.CANCELADA:
			return "O pedido foi cancelado pelo produtor. Em caso de dúvida, entre em contato com ele.";
	}
}

/**
 * Atualização de status do pedido ao comprador (RF-57).
 */
export function orderStatusEmail(input: OrderStatusEmailInput): RenderedEmail {
	const orderNumber = shortOrderId(input.saleId);
	const label = SALE_STATUS_LABELS[input.status];
	const subject = `Pedido #${orderNumber}: ${label}`;
	const title = `Seu pedido está: ${label}`;
	const greeting = `Olá, ${input.customerName}!`;
	const update = `O status do pedido #${orderNumber} mudou para "${label}".`;
	const message = statusMessage(input.status, input.deliveryType);

	const cta = (() => {
		const url = appUrl("/minha-conta?aba=purchases");
		return url ? { label: "Ver meu pedido", url } : null;
	})();

	const html = renderLayout({
		title,
		preheader: update,
		bodyHtml: [
			paragraph(escapeHtml(greeting)),
			paragraph(escapeHtml(update)),
			paragraph(escapeHtml(message)),
		].join("\n"),
		cta,
	});

	const text = renderText(title, [greeting, "", update, "", message], cta);

	return { subject, html, text };
}
