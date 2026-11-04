import type { MigrationInterface, QueryRunner } from "typeorm";

// VER-95: novos status do pedido, ajustes com consentimento do cliente e histórico de status
export class SaleAdjustmentsAndStatusHistory1793827055534
	implements MigrationInterface
{
	name = "SaleAdjustmentsAndStatusHistory1793827055534";

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Novos status do pedido, posicionados antes dos estados finais
		await queryRunner.query(
			`ALTER TYPE "public"."sales_status_enum" ADD VALUE IF NOT EXISTS 'EM_PREPARACAO' BEFORE 'FINALIZADA'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."sales_status_enum" ADD VALUE IF NOT EXISTS 'A_CAMINHO' BEFORE 'FINALIZADA'`,
		);
		await queryRunner.query(
			`ALTER TYPE "public"."sales_status_enum" ADD VALUE IF NOT EXISTS 'AGUARDANDO_APROVACAO_CLIENTE' BEFORE 'FINALIZADA'`,
		);

		// Propostas de ajuste
		await queryRunner.query(
			`CREATE TYPE "public"."sale_adjustments_status_enum" AS ENUM('PENDENTE', 'ACEITO', 'RECUSADO')`,
		);
		await queryRunner.query(
			`CREATE TABLE "sale_adjustments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "seller_id" uuid NOT NULL, "reason" character varying(500) NOT NULL, "status" "public"."sale_adjustments_status_enum" NOT NULL DEFAULT 'PENDENTE', "previous_status" "public"."sales_status_enum" NOT NULL, "responded_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f002b37f91603a6ae8ac9e2010f" PRIMARY KEY ("id"))`,
		);
		// No máximo uma proposta pendente por pedido
		await queryRunner.query(
			`CREATE UNIQUE INDEX "UQ_sale_adjustments_pending_sale" ON "sale_adjustments" ("sale_id") WHERE "status" = 'PENDENTE'`,
		);

		// Itens de cada proposta
		await queryRunner.query(
			`CREATE TABLE "sale_adjustment_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "adjustment_id" uuid NOT NULL, "sale_product_id" uuid NOT NULL, "original_quantity" numeric(10,3) NOT NULL, "original_unit_price" numeric(10,2) NOT NULL, "proposed_quantity" numeric(10,3) NOT NULL, "proposed_unit_price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d760ab246d1825e381c3dea020a" PRIMARY KEY ("id"))`,
		);

		// Histórico de status
		await queryRunner.query(
			`CREATE TABLE "sale_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "status" "public"."sales_status_enum" NOT NULL, "changed_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fa9e434ea014ca3730faa8657a7" PRIMARY KEY ("id"))`,
		);

		// Chaves estrangeiras
		await queryRunner.query(
			`ALTER TABLE "sale_adjustments" ADD CONSTRAINT "FK_2f54e536947a24308cc27c21f96" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_adjustments" ADD CONSTRAINT "FK_022b53b7800edbd78944466af6a" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_adjustment_items" ADD CONSTRAINT "FK_f7f1cee094851cf61b94f524fda" FOREIGN KEY ("adjustment_id") REFERENCES "sale_adjustments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_adjustment_items" ADD CONSTRAINT "FK_41919dc8d8fdc46ad188fbd92e8" FOREIGN KEY ("sale_product_id") REFERENCES "sale_products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_status_history" ADD CONSTRAINT "FK_00d893746b481ec5a6b3b2e57ec" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_status_history" ADD CONSTRAINT "FK_a712c07a672a029eb392794646b" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);

		// Backfill: todo pedido existente nasceu ABERTA na data de criação.
		// Usa só valores antigos do enum, pois os novos não podem ser lidos na mesma transação.
		await queryRunner.query(
			`INSERT INTO "sale_status_history" ("sale_id", "status", "created_at", "updated_at") SELECT "id", 'ABERTA', "created_at", "created_at" FROM "sales"`,
		);
		// Pedidos já finalizados ou cancelados ganham também o status atual, na data da última alteração
		await queryRunner.query(
			`INSERT INTO "sale_status_history" ("sale_id", "status", "created_at", "updated_at") SELECT "id", "status", "updated_at", "updated_at" FROM "sales" WHERE "status"::text <> 'ABERTA'`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		// As tabelas novas usam o enum de status, então saem antes da reversão do tipo
		await queryRunner.query(`DROP TABLE "sale_status_history"`);
		await queryRunner.query(`DROP TABLE "sale_adjustment_items"`);
		await queryRunner.query(`DROP TABLE "sale_adjustments"`);
		await queryRunner.query(
			`DROP TYPE "public"."sale_adjustments_status_enum"`,
		);

		// Pedidos em etapas intermediárias voltam a ABERTA, único status não final antigo
		await queryRunner.query(
			`UPDATE "sales" SET "status" = 'ABERTA' WHERE "status"::text IN ('EM_PREPARACAO', 'A_CAMINHO', 'AGUARDANDO_APROVACAO_CLIENTE')`,
		);

		// O Postgres não remove valores de enum: recria o tipo com os valores antigos
		await queryRunner.query(
			`ALTER TABLE "sales" ALTER COLUMN "status" DROP DEFAULT`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."sales_status_enum_old" AS ENUM('ABERTA', 'FINALIZADA', 'CANCELADA')`,
		);
		await queryRunner.query(
			`ALTER TABLE "sales" ALTER COLUMN "status" TYPE "public"."sales_status_enum_old" USING "status"::"text"::"public"."sales_status_enum_old"`,
		);
		await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
		await queryRunner.query(
			`ALTER TYPE "public"."sales_status_enum_old" RENAME TO "sales_status_enum"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sales" ALTER COLUMN "status" SET DEFAULT 'ABERTA'`,
		);
	}
}
