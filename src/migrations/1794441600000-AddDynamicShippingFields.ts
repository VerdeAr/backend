import type { MigrationInterface, QueryRunner } from "typeorm";

// VER-91: frete por quilômetro (origem e preços do vendedor) e frete gravado no pedido
export class AddDynamicShippingFields1794441600000
	implements MigrationInterface
{
	name = "AddDynamicShippingFields1794441600000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "sellers" ` +
				`ADD COLUMN "latitude" numeric(10,7), ` +
				`ADD COLUMN "longitude" numeric(10,7), ` +
				`ADD COLUMN "shipping_base_fee" numeric(10,2) NOT NULL DEFAULT '0', ` +
				`ADD COLUMN "shipping_price_per_km" numeric(10,2) NOT NULL DEFAULT '0', ` +
				`ADD COLUMN "max_delivery_radius_km" numeric(10,2)`,
		);
		await queryRunner.query(
			`ALTER TABLE "sellers" ` +
				`ADD CONSTRAINT "CHK_sellers_latitude" CHECK ("latitude" IS NULL OR ("latitude" >= -90 AND "latitude" <= 90)), ` +
				`ADD CONSTRAINT "CHK_sellers_longitude" CHECK ("longitude" IS NULL OR ("longitude" >= -180 AND "longitude" <= 180)), ` +
				`ADD CONSTRAINT "CHK_sellers_shipping_base_fee" CHECK ("shipping_base_fee" >= 0), ` +
				`ADD CONSTRAINT "CHK_sellers_shipping_price_per_km" CHECK ("shipping_price_per_km" >= 0), ` +
				`ADD CONSTRAINT "CHK_sellers_max_delivery_radius_km" CHECK ("max_delivery_radius_km" IS NULL OR "max_delivery_radius_km" > 0)`,
		);

		// Pedidos antigos ficam com frete 0 e sem distância: o valor real não foi registrado
		await queryRunner.query(
			`ALTER TABLE "sales" ` +
				`ADD COLUMN "shipping_amount" numeric(10,2) NOT NULL DEFAULT '0', ` +
				`ADD COLUMN "shipping_distance_km" numeric(10,2)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "sales" ` +
				`DROP COLUMN "shipping_distance_km", ` +
				`DROP COLUMN "shipping_amount"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sellers" ` +
				`DROP CONSTRAINT "CHK_sellers_max_delivery_radius_km", ` +
				`DROP CONSTRAINT "CHK_sellers_shipping_price_per_km", ` +
				`DROP CONSTRAINT "CHK_sellers_shipping_base_fee", ` +
				`DROP CONSTRAINT "CHK_sellers_longitude", ` +
				`DROP CONSTRAINT "CHK_sellers_latitude"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sellers" ` +
				`DROP COLUMN "max_delivery_radius_km", ` +
				`DROP COLUMN "shipping_price_per_km", ` +
				`DROP COLUMN "shipping_base_fee", ` +
				`DROP COLUMN "longitude", ` +
				`DROP COLUMN "latitude"`,
		);
	}
}
