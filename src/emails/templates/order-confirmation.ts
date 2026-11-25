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

// Contato público do produtor, o mesmo que o cliente já vê no detalhe da compra
export interface OrderEmailSeller {
	name: string;
	farmName: string | null;
	phone: string | null;
}

export interface OrderConfirmationEmailInput {
	customerName: string;
	saleId: string;
	deliveryType: DeliveryType;
	items: OrderEmailItem[];
	subtotal: number;
	shipping: number;
	total: number;
	paymentMethod: string | null;
	// Endereço de entrega já formatado; só usado na modalidade ENTREGA
	deliveryAddress: string | null;
	sellers: OrderEmailSeller[];
}

// Orientação por forma de pagamento, alinhada à tela de pedido confirmado do frontend
function paymentGuidance(method: string | null, total: number): string {
	const normalized = method?.toLowerCase() ?? "";
	if (normalized.includes("pix")) {
		return "Apresente o comprovante do PIX ao produtor no momento da entrega ou retirada.";
	}
	if (normalized.includes("dinheiro")) {
		return `Prepare o valor exato de ${formatCurrency(total)} ou informe o troco ao produtor.`;
	}
	if (normalized.includes("cart")) {
		return "O produtor levará a máquina de cartão para o pagamento presencial (débito ou crédito).";
	}
	return "Combine o pagamento diretamente com o produtor.";
}

function describeSeller(seller: OrderEmailSeller): string {
	const name = seller.farmName
		? `${seller.farmName} (${seller.name})`
		: seller.name;
	return seller.phone ? `${name}: ${seller.phone}` : name;
}

/**
 * Confirmação de pedido ao comprador (RF-44): resumo dos itens e valores, forma de
 * pagamento e instruções de entrega ou retirada. Na retirada, o e-mail mostra apenas o
 * nome e o telefone de cada produtor (sem o endereço de origem).
 */
export function orderConfirmationEmail(
	input: OrderConfirmationEmailInput,
): RenderedEmail {
	const orderNumber = shortOrderId(input.saleId);
	const subject = `Pedido #${orderNumber} confirmado`;
	const title = "Recebemos o seu pedido!";
	const intro = `Olá, ${input.customerName}! O pedido #${orderNumber} foi registrado e os produtores já foram avisados.`;

	const isDelivery = input.deliveryType === DeliveryType.ENTREGA;
	const summary = [
		{ label: "Subtotal", value: input.subtotal },
		...(isDelivery ? [{ label: "Frete", value: input.shipping }] : []),
		{ label: "Total", value: input.total, bold: true },
	];

	const deliveryLines = isDelivery
		? [
				`Endereço: ${input.deliveryAddress ?? "o endereço do seu cadastro"}`,
				"Os produtores entrarão em contato para combinar o horário da entrega.",
			]
		: [
				"Combine o dia e o horário da retirada com cada produtor:",
				...input.sellers.map((seller) => `• ${describeSeller(seller)}`),
			];

	const paymentLines = [
		`Forma de pagamento: ${input.paymentMethod ?? "não informada"}`,
		paymentGuidance(input.paymentMethod, input.total),
	];

	const cta = (() => {
		const url = appUrl("/minha-conta?aba=purchases");
		return url ? { label: "Ver meu pedido", url } : null;
	})();

	const html = renderLayout({
		title,
		preheader: `Pedido #${orderNumber} — total de ${formatCurrency(input.total)}`,
		bodyHtml: [
			paragraph(escapeHtml(intro)),
			renderItemsTable(input.items, summary),
			renderInfoBox(
				DELIVERY_TYPE_LABELS[input.deliveryType],
				deliveryLines.map((line) => escapeHtml(line)),
			),
			renderInfoBox(
				"Pagamento",
				paymentLines.map((line) => escapeHtml(line)),
			),
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
			...deliveryLines,
			"",
			"Pagamento:",
			...paymentLines,
		],
		cta,
	);

	return { subject, html, text };
}
