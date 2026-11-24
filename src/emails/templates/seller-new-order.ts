import {
	appUrl,
	escapeHtml,
	formatCurrency,
	paragraph,
	type RenderedEmail,
	renderLayout,
	renderText,
} from "@/emails/layout";
import {
	DELIVERY_TYPE_LABELS,
	itemsText,
	type OrderEmailItem,
	renderInfoBox,
	renderItemsTable,
	shortOrderId,
} from "@/emails/order-parts";
import { DeliveryType } from "@/entities/enums";

export interface SellerNewOrderEmailInput {
	sellerName: string;
	saleId: string;
	deliveryType: DeliveryType;
	customerName: string;
	customerPhone: string | null;
	// Endereço do cliente já formatado; só usado na modalidade ENTREGA
	deliveryAddress: string | null;
	// Apenas os itens deste produtor, com o subtotal da parte dele (RF-50)
	items: OrderEmailItem[];
	sellerSubtotal: number;
}

/**
 * Alerta de novo pedido ao produtor (RF-57). Mostra só os itens dele e os mesmos dados de
 * contato e entrega do cliente que o produtor já vê no detalhe do pedido (RF-54).
 */
export function sellerNewOrderEmail(
	input: SellerNewOrderEmailInput,
): RenderedEmail {
	const orderNumber = shortOrderId(input.saleId);
	const subject = `Novo pedido #${orderNumber} recebido`;
	const title = "Você recebeu um novo pedido!";
	const intro = `Olá, ${input.sellerName}! ${input.customerName} fez o pedido #${orderNumber} com produtos seus.`;

	const isDelivery = input.deliveryType === DeliveryType.ENTREGA;
	const summary = [
		{
			label: "Subtotal dos seus itens",
			value: input.sellerSubtotal,
			bold: true,
		},
	];

	const customerLines = [
		`Cliente: ${input.customerName}`,
		...(input.customerPhone ? [`Telefone: ${input.customerPhone}`] : []),
		...(isDelivery
			? [`Endereço de entrega: ${input.deliveryAddress ?? "não informado"}`]
			: ["O cliente vai retirar os produtos com você."]),
	];

	const nextStep =
		"Acesse os seus pedidos para iniciar a preparação ou propor um ajuste de quantidade.";

	const cta = (() => {
		const url = appUrl(`/vendedor/pedidos/${input.saleId}`);
		return url ? { label: "Ver o pedido", url } : null;
	})();

	const html = renderLayout({
		title,
		preheader: `Pedido #${orderNumber} — ${formatCurrency(input.sellerSubtotal)} em produtos seus`,
		bodyHtml: [
			paragraph(escapeHtml(intro)),
			renderItemsTable(input.items, summary),
			renderInfoBox(
				DELIVERY_TYPE_LABELS[input.deliveryType],
				customerLines.map((line) => escapeHtml(line)),
			),
			paragraph(escapeHtml(nextStep)),
		].join("\n"),
		cta,
	});

	const text = renderText(
		title,
		[
			intro,
			"",
			"Itens:",
			...itemsText(input.items, summary),
			"",
			`${DELIVERY_TYPE_LABELS[input.deliveryType]}:`,
			...customerLines,
			"",
			nextStep,
		],
		cta,
	);

	return { subject, html, text };
}
