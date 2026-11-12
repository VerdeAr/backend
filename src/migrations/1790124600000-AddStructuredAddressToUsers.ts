import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddStructuredAddressToUsers1790124600000
	implements MigrationInterface
{
	name = "AddStructuredAddressToUsers1790124600000";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "users" ` +
				`ADD COLUMN "zip_code" character varying(8), ` +
				`ADD COLUMN "street" character varying(255), ` +
				`ADD COLUMN "number" character varying(20), ` +
				`ADD COLUMN "complement" character varying(100), ` +
				`ADD COLUMN "neighborhood_name" character varying(100), ` +
				`ADD COLUMN "city" character varying(100), ` +
				`ADD COLUMN "state" character varying(2)`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "users" ` +
				`DROP COLUMN "state", ` +
				`DROP COLUMN "city", ` +
				`DROP COLUMN "neighborhood_name", ` +
				`DROP COLUMN "complement", ` +
				`DROP COLUMN "number", ` +
				`DROP COLUMN "street", ` +
				`DROP COLUMN "zip_code"`,
		);
	}
}
