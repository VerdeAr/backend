import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { escapeHtml } from "@/emails/layout";
import { orderConfirmationEmail } from "@/emails/templates/order-confirmation";
import { orderStatusEmail } from "@/emails/templates/order-status";
import { sellerNewOrderEmail } from "@/emails/templates/seller-new-order";
import { welcomeEmail } from "@/emails/templates/welcome";
import { DeliveryType, SaleStatus, UserRole } from "@/entities/enums";
import { EmailService } from "@/services/email.service";
import {
	createProduct,
	placeOrder,
	type RegisteredUser,
	registerUser,
} from "./helpers/factories";

// VER-83: e-mails transacionais com o SDK do Resend simulado (nenhum e-mail real é enviado)

interface SentEmail {
	from: string;
	to: string;
	subject: string;
	html: string;
	text: string;
}

type SendResult =
	| { data: { id: string }; error: null }
	| {
			data: null;
			error: { name: string; message: string; statusCode: number | null };
	  };

// Por padrão o Resend simulado aceita o envio; o mockReset volta a esta implementação
const { sendMock } = vi.hoisted(() => ({
	sendMock: vi.fn<(email: SentEmail) => Promise<SendResult>>(async () => ({
		data: { id: "email-simulado" },
		error: null,
	})),
}));

vi.mock("resend", () => ({
	Resend: class {
		emails = { send: sendMock };
	},
}));

function sentEmails(): SentEmail[] {
	return sendMock.mock.calls.map(([email]) => email);
}

function sentTo(address: string): SentEmail[] {
	return sentEmails().filter((email) => email.to === address);
}

// Os envios rodam em segundo plano depois da resposta; espera até chegarem ao Resend
async function waitForEmails(predicate: () => boolean): Promise<void> {
	await vi.waitFor(() => expect(predicate()).toBe(true), { timeout: 10_000 });
}

// Dá tempo para um envio indevido aparecer antes de afirmar que ele não ocorreu
function settle(ms = 500): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const originalEnv = {
	RESEND_API_KEY: process.env.RESEND_API_KEY,
	EMAIL_FROM: process.env.EMAIL_FROM,
	APP_URL: process.env.APP_URL,
};

function restoreEnv(): void {
	for (const [key, value] of Object.entries(originalEnv)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
}

let errorSpy: MockInstance<typeof console.error>;
let warnSpy: MockInstance<typeof console.warn>;

beforeEach(() => {
	sendMock.mockReset();
	process.env.RESEND_API_KEY = "re_chave_de_teste";
	process.env.EMAIL_FROM = "VerdeAr <nao-responda@teste.verdear.dev>";
	delete process.env.APP_URL;
	// Os logs de falha são esperados aqui; o spy os silencia e permite conferi-los
	errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
	errorSpy.mockRestore();
	warnSpy.mockRestore();
});

afterAll(restoreEnv);

const SALE_ID = "1a2b3c4d-0000-4000-8000-000000000000";
const ITEMS = [
	{
		name: "Alface <b>crespa</b>",
		quantity: 2,
		unit: "un",
		unitPrice: 3.5,
		total: 7,
	},
	{ name: "Tomate", quantity: 1.25, unit: "kg", unitPrice: 8.9, total: 11.13 },
];

describe("templates de e-mail", () => {
	it("escapa os caracteres especiais de HTML", () => {
		expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
			"&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
		);
		expect(escapeHtml(null)).toBe("");
	});

	it("não deixa o nome do usuário injetar HTML nas boas-vindas", () => {
		const email = welcomeEmail({
			name: '<script>alert(1)</script> "Zé"',
			role: UserRole.CLIENTE,
		});

		expect(email.html).not.toContain("<script>");
		expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
		expect(email.subject).toBe("Boas-vindas ao VerdeAr");
	});

	it("inclui o botão só quando APP_URL é um endereço http(s)", () => {
		const input = { name: "Maria", role: UserRole.VENDEDOR };

		expect(welcomeEmail(input).html).not.toContain("<a href");

		process.env.APP_URL = "javascript:alert(1)";
		expect(welcomeEmail(input).html).not.toContain("<a href");

		process.env.APP_URL = "https://verdear.app";
		const email = welcomeEmail(input);
		expect(email.html).toContain('href="https://verdear.app/minha-conta"');
		expect(email.text).toContain("https://verdear.app/minha-conta");
	});

	it("confirmação na Entrega mostra frete e endereço", () => {
		const email = orderConfirmationEmail({
			customerName: "Maria",
			saleId: SALE_ID,
			deliveryType: DeliveryType.ENTREGA,
			items: ITEMS,
			subtotal: 18.13,
			shipping: 5,
			total: 23.13,
			paymentMethod: "Dinheiro",
			deliveryAddress: "Rua A, 10 - Centro",
			sellers: [],
		});

		expect(email.subject).toBe("Pedido #1A2B3C4D confirmado");
		expect(email.html).toContain("Alface &lt;b&gt;crespa&lt;/b&gt;");
		expect(email.text).toContain("Frete: R$ 5,00");
		expect(email.text).toContain("Total: R$ 23,13");
		expect(email.text).toContain("Endereço: Rua A, 10 - Centro");
		expect(email.text).toContain("Prepare o valor exato de R$ 23,13");
	});

	it("confirmação na Retirada omite o frete e lista o contato dos produtores", () => {
		const email = orderConfirmationEmail({
			customerName: "Maria",
			saleId: SALE_ID,
			deliveryType: DeliveryType.RETIRADA,
			items: ITEMS,
			subtotal: 18.13,
			shipping: 0,
			total: 18.13,
			paymentMethod: "PIX",
			deliveryAddress: null,
			sellers: [
				{ name: "João", farmName: "Sítio Boa Vista", phone: "(43) 99999-0000" },
			],
		});

		expect(email.text).not.toContain("Frete");
		expect(email.text).toContain("Sítio Boa Vista (João): (43) 99999-0000");
		expect(email.text).toContain("comprovante do PIX");
	});

	it("alerta ao produtor mostra o subtotal dele e o link do pedido", () => {
		process.env.APP_URL = "https://verdear.app/";
		const email = sellerNewOrderEmail({
			sellerName: "João",
			saleId: SALE_ID,
			deliveryType: DeliveryType.RETIRADA,
			customerName: "Maria",
			customerPhone: "(43) 98888-0000",
			deliveryAddress: null,
			items: ITEMS,
			sellerSubtotal: 18.13,
		});

		expect(email.subject).toBe("Novo pedido #1A2B3C4D recebido");
		expect(email.text).toContain("Subtotal dos seus itens: R$ 18,13");
		expect(email.text).toContain("Telefone: (43) 98888-0000");
		expect(email.html).toContain(
			`href="https://verdear.app/vendedor/pedidos/${SALE_ID}"`,
		);
	});

	it("atualização de status usa o rótulo exibido ao cliente", () => {
		const email = orderStatusEmail({
			customerName: "Maria",
			saleId: SALE_ID,
			status: SaleStatus.A_CAMINHO,
			deliveryType: DeliveryType.ENTREGA,
		});

		expect(email.subject).toBe("Pedido #1A2B3C4D: A caminho");
		expect(email.text).toContain("saíram para entrega");
	});
});

describe("EmailService", () => {
	const message = {
		to: "cliente@teste.verdear.dev",
		subject: "Assunto",
		html: "<p>Oi</p>",
		text: "Oi",
	};

	it("sem RESEND_API_KEY não chama o Resend e avisa uma única vez", async () => {
		delete process.env.RESEND_API_KEY;
		const service = new EmailService();

		expect(await service.send("boas-vindas", message)).toBe(false);
		expect(await service.send("boas-vindas", message)).toBe(false);

		expect(sendMock).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledTimes(1);
	});

	it("envia com o remetente de EMAIL_FROM", async () => {
		const service = new EmailService();

		expect(await service.send("boas-vindas", message)).toBe(true);
		expect(sendMock).toHaveBeenCalledWith({
			from: "VerdeAr <nao-responda@teste.verdear.dev>",
			...message,
		});
	});

	it("erro devolvido pelo Resend é registrado sem expor o destinatário", async () => {
		sendMock.mockResolvedValueOnce({
			data: null,
			error: {
				name: "validation_error",
				message: "API key is invalid",
				statusCode: 401,
			},
		});
		const service = new EmailService();

		expect(
			await service.send("confirmacao-pedido", message, { saleId: "s1" }),
		).toBe(false);

		const log = String(errorSpy.mock.calls[0]?.[0]);
		expect(log).toContain('"confirmacao-pedido"');
		expect(log).toContain("saleId=s1");
		expect(log).toContain("API key is invalid");
		expect(log).not.toContain(message.to);
	});

	it("falha de rede não lança erro", async () => {
		sendMock.mockRejectedValueOnce(new Error("fetch failed"));
		const service = new EmailService();

		await expect(service.send("status-pedido", message)).resolves.toBe(false);
		expect(String(errorSpy.mock.calls[0]?.[0])).toContain("fetch failed");
	});
});

describe("disparos nos fluxos da API", () => {
	let sellerA: RegisteredUser;
	let sellerB: RegisteredUser;
	let customer: RegisteredUser;
	let productA: { id: string; name: string };
	let productB: { id: string; name: string };

	beforeAll(async () => {
		sellerA = await registerUser("VENDEDOR");
		sellerB = await registerUser("VENDEDOR");
		customer = await registerUser("CLIENTE");
		productA = await createProduct(sellerA.client, { name: "Alface do A" });
		productB = await createProduct(sellerB.client, { name: "Couve do B" });
	});

	it("o cadastro envia as boas-vindas ao novo usuário", async () => {
		const user = await registerUser("CLIENTE");

		await waitForEmails(() => sentTo(user.user.email).length === 1);
		expect(sentTo(user.user.email)[0].subject).toBe("Boas-vindas ao VerdeAr");
	});

	it("o checkout envia a confirmação e um alerta por produtor, só com os itens dele", async () => {
		const saleId = await placeOrder(
			customer.client,
			[
				{ productId: productA.id, quantity: 1 },
				{ productId: productB.id, quantity: 2 },
			],
			"RETIRADA",
		);
		const orderNumber = saleId.slice(0, 8).toUpperCase();
		const isNewOrder = (email: SentEmail) =>
			email.subject.includes(orderNumber);

		await waitForEmails(
			() =>
				sentTo(customer.user.email).some(isNewOrder) &&
				sentTo(sellerA.user.email).some(isNewOrder) &&
				sentTo(sellerB.user.email).some(isNewOrder),
		);

		const confirmation = sentTo(customer.user.email).find(isNewOrder)!;
		expect(confirmation.subject).toBe(`Pedido #${orderNumber} confirmado`);
		expect(confirmation.html).toContain(productA.name);
		expect(confirmation.html).toContain(productB.name);

		const alertA = sentTo(sellerA.user.email).find(isNewOrder)!;
		expect(alertA.subject).toBe(`Novo pedido #${orderNumber} recebido`);
		expect(alertA.html).toContain(productA.name);
		expect(alertA.html).not.toContain(productB.name);

		const alertB = sentTo(sellerB.user.email).find(isNewOrder)!;
		expect(alertB.html).toContain(productB.name);
		expect(alertB.html).not.toContain(productA.name);
	});

	it("a mudança de status avisa o cliente, mas repetir o mesmo status não", async () => {
		const saleId = await placeOrder(
			customer.client,
			[{ productId: productA.id, quantity: 1 }],
			"RETIRADA",
		);
		const orderNumber = saleId.slice(0, 8).toUpperCase();
		const statusEmails = () =>
			sentTo(customer.user.email).filter((email) =>
				email.subject.startsWith(`Pedido #${orderNumber}:`),
			);
		const changeStatus = (status: string) =>
			sellerA.client
				.patch(`/vendedor/pedidos/${saleId}/status`)
				.send({ status });

		expect((await changeStatus("EM_PREPARACAO")).status).toBe(200);
		await waitForEmails(() => statusEmails().length === 1);

		expect((await changeStatus("EM_PREPARACAO")).status).toBe(200);
		await settle();
		expect(statusEmails()).toHaveLength(1);

		expect((await changeStatus("FINALIZADA")).status).toBe(200);
		await waitForEmails(() => statusEmails().length === 2);

		expect(statusEmails().map((email) => email.subject)).toEqual([
			`Pedido #${orderNumber}: Em preparação`,
			`Pedido #${orderNumber}: Concluído`,
		]);
	});

	it("uma falha do Resend não impede o checkout nem a mudança de status", async () => {
		sendMock.mockRejectedValue(new Error("Resend fora do ar"));

		const saleId = await placeOrder(
			customer.client,
			[{ productId: productB.id, quantity: 1 }],
			"RETIRADA",
		);
		const response = await sellerB.client
			.patch(`/vendedor/pedidos/${saleId}/status`)
			.send({ status: "EM_PREPARACAO" });
		expect(response.status).toBe(200);

		// Confirmação, alerta ao produtor e status: as três falhas ficam no log
		await waitForEmails(
			() =>
				errorSpy.mock.calls.filter(([log]) =>
					String(log).includes("Resend fora do ar"),
				).length >= 3,
		);
	});
});
