import { DeliveryType, SaleStatus } from "@/entities/enums";

/**
 * Máquina de estados do pedido para as mudanças feitas pelo vendedor (RF-52 e RF-55).
 *
 * Fluxo: ABERTA (Recebido) → EM_PREPARACAO → A_CAMINHO → FINALIZADA (Concluído).
 * - A_CAMINHO só existe na Entrega; na Retirada o pedido vai de EM_PREPARACAO a FINALIZADA.
 * - ABERTA → FINALIZADA continua permitido por compatibilidade com o fluxo anterior.
 * - AGUARDANDO_APROVACAO_CLIENTE só é alcançado pela proposta de ajuste e só sai pela
 *   resposta do cliente; o vendedor pode apenas cancelar o pedido nesse estado.
 * - FINALIZADA e CANCELADA são finais.
 */
const SELLER_TRANSITIONS: Record<SaleStatus, readonly SaleStatus[]> = {
	[SaleStatus.ABERTA]: [
		SaleStatus.EM_PREPARACAO,
		SaleStatus.FINALIZADA,
		SaleStatus.CANCELADA,
	],
	[SaleStatus.EM_PREPARACAO]: [
		SaleStatus.A_CAMINHO,
		SaleStatus.FINALIZADA,
		SaleStatus.CANCELADA,
	],
	[SaleStatus.A_CAMINHO]: [SaleStatus.FINALIZADA],
	[SaleStatus.AGUARDANDO_APROVACAO_CLIENTE]: [SaleStatus.CANCELADA],
	[SaleStatus.FINALIZADA]: [],
	[SaleStatus.CANCELADA]: [],
};

// Status em que o vendedor pode propor um ajuste de itens ou pesagem (RF-56)
export const ADJUSTABLE_STATUSES: readonly SaleStatus[] = [
	SaleStatus.ABERTA,
	SaleStatus.EM_PREPARACAO,
];

// Status que exigem ação do vendedor, usados no contador de pendentes do cabeçalho
export const SELLER_PENDING_STATUSES: readonly SaleStatus[] = [
	SaleStatus.ABERTA,
	SaleStatus.EM_PREPARACAO,
];

export const FINAL_STATUSES: readonly SaleStatus[] = [
	SaleStatus.FINALIZADA,
	SaleStatus.CANCELADA,
];

export function canSellerTransition(
	from: SaleStatus,
	to: SaleStatus,
	deliveryType: DeliveryType,
): boolean {
	if (!SELLER_TRANSITIONS[from].includes(to)) {
		return false;
	}

	// "A Caminho" não se aplica à Retirada
	if (to === SaleStatus.A_CAMINHO) {
		return deliveryType === DeliveryType.ENTREGA;
	}

	// Na Entrega, um pedido em preparação precisa passar por "A Caminho" antes de concluir
	if (from === SaleStatus.EM_PREPARACAO && to === SaleStatus.FINALIZADA) {
		return deliveryType === DeliveryType.RETIRADA;
	}

	return true;
}
