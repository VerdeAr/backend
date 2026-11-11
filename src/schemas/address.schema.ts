import { z } from "zod";

export const BRAZILIAN_STATES = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

const emptyStringToUndefined = (val: unknown) =>
	typeof val === "string" && val.trim() === "" ? undefined : val;

export const zipCodeSchema = z
	.string()
	.refine(
		(val) => /^\d{5}-?\d{3}$/.test(val.trim()),
		"CEP informado é inválido. Utilize o formato 00000-000 ou 8 dígitos numéricos.",
	)
	.transform((val) => val.replace(/\D/g, ""));

export const optionalZipCodeSchema = z.preprocess(
	emptyStringToUndefined,
	zipCodeSchema.optional().nullable(),
);

export const stateSchema = z
	.string()
	.length(2, "UF deve conter exatamente 2 caracteres")
	.transform((val) => val.toUpperCase())
	.refine(
		(val) => BRAZILIAN_STATES.includes(val as BrazilianState),
		"UF informada é inválida.",
	);

export const optionalStateSchema = z.preprocess(
	emptyStringToUndefined,
	stateSchema.optional().nullable(),
);

export const structuredAddressInputSchema = z.object({
	zip_code: optionalZipCodeSchema,
	cep: optionalZipCodeSchema,
	street: z.preprocess(
		emptyStringToUndefined,
		z.string().max(255, "Logradouro muito longo").optional().nullable(),
	),
	number: z.preprocess(
		emptyStringToUndefined,
		z.string().max(20, "Número muito longo").optional().nullable(),
	),
	complement: z.preprocess(
		emptyStringToUndefined,
		z.string().max(100, "Complemento muito longo").optional().nullable(),
	),
	neighborhood_name: z.preprocess(
		emptyStringToUndefined,
		z.string().max(100, "Nome do bairro muito longo").optional().nullable(),
	),
	neighborhood: z.preprocess(
		emptyStringToUndefined,
		z.string().max(100, "Nome do bairro muito longo").optional().nullable(),
	),
	city: z.preprocess(
		emptyStringToUndefined,
		z.string().max(100, "Nome da cidade muito longo").optional().nullable(),
	),
	state: optionalStateSchema,
});

export interface ExtractedStructuredAddress {
	zip_code?: string | null;
	street?: string | null;
	number?: string | null;
	complement?: string | null;
	neighborhood_name?: string | null;
	city?: string | null;
	state?: string | null;
}

export function extractStructuredAddress(
	data: Record<string, unknown>,
): ExtractedStructuredAddress {
	const result: ExtractedStructuredAddress = {};

	const zipCode = data.zip_code !== undefined ? data.zip_code : data.cep;
	if (zipCode !== undefined) {
		result.zip_code = (zipCode as string | null) || null;
	}

	const street = data.street !== undefined ? data.street : data.logradouro;
	if (street !== undefined) {
		result.street = (street as string | null) || null;
	}

	const number = data.number !== undefined ? data.number : data.numero;
	if (number !== undefined) {
		result.number = (number as string | null) || null;
	}

	const complement =
		data.complement !== undefined ? data.complement : data.complemento;
	if (complement !== undefined) {
		result.complement = (complement as string | null) || null;
	}

	const neighborhoodName =
		data.neighborhood_name !== undefined
			? data.neighborhood_name
			: data.neighborhood !== undefined
				? data.neighborhood
				: data.bairro;
	if (neighborhoodName !== undefined) {
		result.neighborhood_name = (neighborhoodName as string | null) || null;
	}

	const city = data.city !== undefined ? data.city : data.cidade;
	if (city !== undefined) {
		result.city = (city as string | null) || null;
	}

	const state = data.state !== undefined ? data.state : data.uf;
	if (state !== undefined) {
		result.state = (state as string | null) || null;
	}

	return result;
}

export function formatFullAddress(
	data?: {
		street?: string | null;
		number?: string | null;
		complement?: string | null;
		neighborhood_name?: string | null;
		city?: string | null;
		state?: string | null;
		zip_code?: string | null;
		address?: string | null;
	} | null,
): string | null {
	if (!data) return null;

	const parts: string[] = [];

	if (data.street) {
		let streetPart = data.street;
		if (data.number) {
			streetPart += `, ${data.number}`;
		}
		if (data.complement) {
			streetPart += `, ${data.complement}`;
		}
		parts.push(streetPart);
	}

	if (data.neighborhood_name) {
		parts.push(data.neighborhood_name);
	}

	if (data.city && data.state) {
		parts.push(`${data.city} - ${data.state}`);
	} else if (data.city) {
		parts.push(data.city);
	} else if (data.state) {
		parts.push(data.state);
	}

	if (data.zip_code) {
		const digits = data.zip_code.replace(/\D/g, "");
		const formattedCep =
			digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
		parts.push(`CEP: ${formattedCep}`);
	}

	if (parts.length > 0) {
		return parts.join(" - ");
	}

	return data.address || null;
}
