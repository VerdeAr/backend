import { z } from "zod";
import { zipCodeSchema } from "./address.schema";

const latitudeSchema = z
	.number("Latitude deve ser um número")
	.min(-90, "Latitude deve estar entre -90 e 90")
	.max(90, "Latitude deve estar entre -90 e 90");

const longitudeSchema = z
	.number("Longitude deve ser um número")
	.min(-180, "Longitude deve estar entre -180 e 180")
	.max(180, "Longitude deve estar entre -180 e 180");

const moneySchema = (label: string) =>
	z
		.number(`${label} deve ser um número`)
		.min(0, `${label} não pode ser negativo`)
		.max(99_999_999.99, `${label} muito alto`);

// POST /frete/calcular-rota: destino por coordenadas OU por CEP
export const calculateRouteSchema = z
	.object({
		seller_id: z.uuid("ID de vendedor inválido"),
		latitude: latitudeSchema.optional(),
		longitude: longitudeSchema.optional(),
		cep: zipCodeSchema.optional(),
	})
	.superRefine((data, ctx) => {
		const hasLatitude = data.latitude !== undefined;
		const hasLongitude = data.longitude !== undefined;
		const hasCoordinates = hasLatitude && hasLongitude;

		if (hasLatitude !== hasLongitude) {
			ctx.addIssue({
				code: "custom",
				path: [hasLatitude ? "longitude" : "latitude"],
				message: "Informe latitude e longitude juntas.",
			});
			return;
		}

		if (!hasCoordinates && !data.cep) {
			ctx.addIssue({
				code: "custom",
				path: ["cep"],
				message: "Informe o destino: latitude e longitude ou CEP.",
			});
		}

		if (hasCoordinates && data.cep) {
			ctx.addIssue({
				code: "custom",
				path: ["cep"],
				message: "Informe o destino por coordenadas ou por CEP, não os dois.",
			});
		}
	});

// PUT /pessoa/frete: taxa fixa antiga + configuração do frete por km (todos opcionais)
export const updateShippingSettingsSchema = z
	.object({
		fixed_shipping_rate: moneySchema("Valor de frete").optional(),
		shipping_base_fee: moneySchema("Taxa base").optional(),
		shipping_price_per_km: moneySchema("Preço por km").optional(),
		max_delivery_radius_km: z
			.number("Raio de entrega deve ser um número")
			.positive("Raio de entrega deve ser maior que zero")
			.max(99_999_999.99, "Raio de entrega muito alto")
			.nullable()
			.optional(),
		latitude: latitudeSchema.nullable().optional(),
		longitude: longitudeSchema.nullable().optional(),
	})
	.superRefine((data, ctx) => {
		// Origem só pode ser definida ou removida por inteiro
		const latitudeGiven = data.latitude !== undefined;
		const longitudeGiven = data.longitude !== undefined;

		if (
			latitudeGiven !== longitudeGiven ||
			(data.latitude === null) !== (data.longitude === null)
		) {
			ctx.addIssue({
				code: "custom",
				path: [latitudeGiven ? "longitude" : "latitude"],
				message:
					"Informe latitude e longitude juntas (ou as duas como null para remover a origem).",
			});
		}

		if (Object.values(data).every((value) => value === undefined)) {
			ctx.addIssue({
				code: "custom",
				path: [],
				message: "Informe ao menos um campo de frete para atualizar.",
			});
		}
	});

export type CalculateRouteInput = z.infer<typeof calculateRouteSchema>;
export type UpdateShippingSettingsInput = z.infer<
	typeof updateShippingSettingsSchema
>;
