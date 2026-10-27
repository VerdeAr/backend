import { randomUUID } from "node:crypto";
import { cpf } from "cpf-cnpj-validator";
import { type Client, createClient } from "./client";

export type TestRole = "CLIENTE" | "VENDEDOR";

export interface TestCredentials {
	name: string;
	email: string;
	password: string;
	cpf: string;
	role: TestRole;
}

export interface RegisteredUser {
	client: Client;
	credentials: TestCredentials;
	user: { id: string; email: string; role: TestRole };
}

// O gerador da biblioteca produz CNPJ alfanumérico, que a API ainda não aceita (ela só
// considera dígitos). Por isso o CNPJ numérico válido é gerado aqui.
function generateNumericCnpj(): string {
	const digits = Array.from({ length: 8 }, () =>
		Math.floor(Math.random() * 10),
	).concat([0, 0, 0, 1]);

	const checkDigit = (base: number[], weights: number[]) => {
		const sum = base.reduce(
			(acc, digit, index) => acc + digit * weights[index],
			0,
		);
		const remainder = sum % 11;
		return remainder < 2 ? 0 : 11 - remainder;
	};

	digits.push(checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));
	digits.push(checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]));

	return digits.join("");
}

// Cada chamada gera dados únicos, então os testes não dependem do estado anterior do banco
export async function registerUser(
	role: TestRole = "CLIENTE",
): Promise<RegisteredUser> {
	const client = createClient();
	const suffix = randomUUID().slice(0, 8);

	const credentials: TestCredentials = {
		name: `Teste ${role.toLowerCase()} ${suffix}`,
		email: `${role.toLowerCase()}.${suffix}@teste.verdear.dev`,
		password: "senha-teste-123",
		cpf: cpf.generate(),
		role,
	};

	const sellerFields =
		role === "VENDEDOR"
			? {
					cnpj: generateNumericCnpj(),
					farm_name: `Fazenda ${suffix}`,
					description: "Produtor criado pelos testes automatizados",
				}
			: {};

	const response = await client
		.post("/auth/register")
		.send({ ...credentials, ...sellerFields });

	if (response.status !== 201) {
		throw new Error(
			`Falha ao cadastrar ${role}: ${response.status} ${JSON.stringify(response.body)}`,
		);
	}

	return { client, credentials, user: response.body.user };
}

// Faz login em um cliente novo, sem reaproveitar os cookies do cadastro
export async function loginAs(credentials: TestCredentials): Promise<Client> {
	const client = createClient();

	const response = await client
		.post("/auth/login")
		.send({ email: credentials.email, password: credentials.password });

	if (response.status !== 200) {
		throw new Error(
			`Falha ao fazer login: ${response.status} ${JSON.stringify(response.body)}`,
		);
	}

	return client;
}

export interface CreatedProduct {
	id: string;
	name: string;
}

// Cria um produto ativo usando a primeira categoria e unidade de medida do seed
export async function createProduct(
	seller: Client,
	overrides: { name?: string; price?: number; stock?: number } = {},
): Promise<CreatedProduct> {
	const [categories, units] = await Promise.all([
		seller.get("/categorias"),
		seller.get("/unidades-medida"),
	]);

	const response = await seller.post("/vendedor/produtos").send({
		name: overrides.name ?? `Tomate ${randomUUID().slice(0, 8)}`,
		price: overrides.price ?? 8.5,
		stock: overrides.stock ?? 10,
		category_id: categories.body[0].id,
		measurement_unit_id: units.body[0].id,
		description: "Produto criado pelos testes automatizados",
	});

	if (response.status !== 201) {
		throw new Error(
			`Falha ao criar produto: ${response.status} ${JSON.stringify(response.body)}`,
		);
	}

	return { id: response.body.id, name: response.body.name };
}
