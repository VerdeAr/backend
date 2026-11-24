import {
	appUrl,
	escapeHtml,
	paragraph,
	type RenderedEmail,
	renderLayout,
	renderText,
} from "@/emails/layout";
import { UserRole } from "@/entities/enums";

export interface WelcomeEmailInput {
	name: string;
	role: UserRole;
}

/**
 * Boas-vindas ao novo usuário (RF-44). O Vendedor recebe a orientação de cadastrar
 * os produtos; o Cliente, a de conhecer a vitrine.
 */
export function welcomeEmail(input: WelcomeEmailInput): RenderedEmail {
	const isSeller = input.role === UserRole.VENDEDOR;
	const title = `Boas-vindas ao VerdeAr, ${input.name}!`;
	const subject = "Boas-vindas ao VerdeAr";

	const intro = "Seu cadastro foi concluído com sucesso.";
	const guidance = isSeller
		? "Agora você já pode cadastrar seus produtos, definir o frete e acompanhar os pedidos em Minha Conta. Como vendedor, você também pode comprar de outros produtores."
		: "Agora você já pode conhecer os produtos dos produtores locais, montar o seu carrinho e acompanhar os seus pedidos em Minha Conta.";

	const cta = (() => {
		const url = appUrl(isSeller ? "/minha-conta" : "/");
		if (!url) return null;
		return { label: isSeller ? "Ir para Minha Conta" : "Ver a vitrine", url };
	})();

	const html = renderLayout({
		title,
		preheader: intro,
		bodyHtml: [
			paragraph(`Olá, ${escapeHtml(input.name)}!`),
			paragraph(escapeHtml(intro)),
			paragraph(escapeHtml(guidance)),
		].join("\n"),
		cta,
	});

	const text = renderText(
		title,
		[`Olá, ${input.name}!`, "", intro, "", guidance],
		cta,
	);

	return { subject, html, text };
}
