import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790124561841 implements MigrationInterface {
	name = "InitialSchema1790124561841";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "neighborhoods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "city" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_249f3b7c3601adff79e56fa36f6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "sellers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "description" text, "cnpj" character varying(18), "farm_name" character varying(150), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_83f4670f0e114d0be3731bade87" UNIQUE ("user_id"), CONSTRAINT "REL_83f4670f0e114d0be3731bade8" UNIQUE ("user_id"), CONSTRAINT "PK_97337ccbf692c58e6c7682de8a2" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."carts_delivery_type_enum" AS ENUM('ENTREGA', 'RETIRADA')`,
		);
		await queryRunner.query(
			`CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "delivery_type" "public"."carts_delivery_type_enum", "payment_method" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2ec1c94a977b940d85a4f498aea" UNIQUE ("user_id"), CONSTRAINT "REL_2ec1c94a977b940d85a4f498ae" UNIQUE ("user_id"), CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."chats_status_enum" AS ENUM('ATIVO', 'FINALIZADO')`,
		);
		await queryRunner.query(
			`CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "seller_id" uuid NOT NULL, "status" "public"."chats_status_enum" NOT NULL DEFAULT 'ATIVO', "last_message_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "measurement_units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "symbol" character varying(10), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fd7e9079abab775ab791dba3457" UNIQUE ("name"), CONSTRAINT "PK_c2442ce42194b3e63b4f502ad40" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "category_id" uuid, "measurement_unit_id" uuid, "name" character varying(255) NOT NULL, "price" numeric(10,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "image_url" character varying(500), "stock" numeric(10,3) NOT NULL DEFAULT '0', "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cart_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(10,3) NOT NULL DEFAULT '1', "price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chat_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "description" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7de68a689323ce826d3d9b158c7" UNIQUE ("description"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."sales_delivery_type_enum" AS ENUM('ENTREGA', 'RETIRADA')`,
		);
		await queryRunner.query(
			`CREATE TYPE "public"."sales_status_enum" AS ENUM('ABERTA', 'FINALIZADA', 'CANCELADA')`,
		);
		await queryRunner.query(
			`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customer_id" uuid NOT NULL, "delivery_type" "public"."sales_delivery_type_enum" NOT NULL DEFAULT 'RETIRADA', "total_amount" numeric(10,2) NOT NULL, "status" "public"."sales_status_enum" NOT NULL DEFAULT 'ABERTA', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "payment_method_id" uuid, "amount" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "customer_id" uuid NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "sale_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sale_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(10,3) NOT NULL, "unit_price" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_671035d8536ad74771c78804d6e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "shippings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "neighborhood_id" uuid NOT NULL, "price" numeric(10,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_665fb613135782a598a2b47e5b2" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "cpf" character varying(14)`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "UQ_230b925048540454c8b4c481e1c" UNIQUE ("cpf")`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "phone" character varying(20)`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "address" character varying(255)`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "neighborhood_id" uuid`);
		await queryRunner.query(
			`CREATE TYPE "public"."users_role_enum" AS ENUM('CLIENTE', 'VENDEDOR')`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'CLIENTE'`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD "fixed_shipping_rate" numeric(10,2) DEFAULT '0'`,
		);
		await queryRunner.query(`ALTER TABLE "users" ADD "last_seen" TIMESTAMP`);
		await queryRunner.query(
			`ALTER TABLE "sellers" ADD CONSTRAINT "FK_83f4670f0e114d0be3731bade87" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" ADD CONSTRAINT "FK_2f8c5adab8cb035920a375e8a9a" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "chats" ADD CONSTRAINT "FK_ec09bc2616849e329a7e4b44ffb" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "chats" ADD CONSTRAINT "FK_f754443807ae962605b6158bf03" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" ADD CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" ADD CONSTRAINT "FK_3c6bc52ec3da3d20774865a72ee" FOREIGN KEY ("measurement_unit_id") REFERENCES "measurement_units"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "messages" ADD CONSTRAINT "FK_7540635fef1922f0b156b9ef74f" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sales" ADD CONSTRAINT "FK_c51005b2b06cec7aa17462c54f5" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "payments" ADD CONSTRAINT "FK_a9272c4415ef64294b104e378ac" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "payments" ADD CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "reviews" ADD CONSTRAINT "FK_e49b8f6b8f74fb09c818078f198" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "reviews" ADD CONSTRAINT "FK_4dd42f48aa60ad8c0d5d5c4ea5b" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_products" ADD CONSTRAINT "FK_694a0bbc8e8aad1f760cafe2e69" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_products" ADD CONSTRAINT "FK_b9ca983d791e014f1f32c12371d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "shippings" ADD CONSTRAINT "FK_452446ea7b71760734a90099b78" FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "shippings" ADD CONSTRAINT "FK_7eed2b5855b7067786e5aa106e1" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "shippings" DROP CONSTRAINT "FK_7eed2b5855b7067786e5aa106e1"`,
		);
		await queryRunner.query(
			`ALTER TABLE "shippings" DROP CONSTRAINT "FK_452446ea7b71760734a90099b78"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_products" DROP CONSTRAINT "FK_b9ca983d791e014f1f32c12371d"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sale_products" DROP CONSTRAINT "FK_694a0bbc8e8aad1f760cafe2e69"`,
		);
		await queryRunner.query(
			`ALTER TABLE "reviews" DROP CONSTRAINT "FK_4dd42f48aa60ad8c0d5d5c4ea5b"`,
		);
		await queryRunner.query(
			`ALTER TABLE "reviews" DROP CONSTRAINT "FK_e49b8f6b8f74fb09c818078f198"`,
		);
		await queryRunner.query(
			`ALTER TABLE "payments" DROP CONSTRAINT "FK_12fd861c33c885f01b9a7da7d93"`,
		);
		await queryRunner.query(
			`ALTER TABLE "payments" DROP CONSTRAINT "FK_a9272c4415ef64294b104e378ac"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sales" DROP CONSTRAINT "FK_c51005b2b06cec7aa17462c54f5"`,
		);
		await queryRunner.query(
			`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
		);
		await queryRunner.query(
			`ALTER TABLE "messages" DROP CONSTRAINT "FK_7540635fef1922f0b156b9ef74f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`,
		);
		await queryRunner.query(
			`ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" DROP CONSTRAINT "FK_3c6bc52ec3da3d20774865a72ee"`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
		);
		await queryRunner.query(
			`ALTER TABLE "products" DROP CONSTRAINT "FK_425ee27c69d6b8adc5d6475dcfe"`,
		);
		await queryRunner.query(
			`ALTER TABLE "chats" DROP CONSTRAINT "FK_f754443807ae962605b6158bf03"`,
		);
		await queryRunner.query(
			`ALTER TABLE "chats" DROP CONSTRAINT "FK_ec09bc2616849e329a7e4b44ffb"`,
		);
		await queryRunner.query(
			`ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`,
		);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "FK_2f8c5adab8cb035920a375e8a9a"`,
		);
		await queryRunner.query(
			`ALTER TABLE "sellers" DROP CONSTRAINT "FK_83f4670f0e114d0be3731bade87"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_seen"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "fixed_shipping_rate"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
		await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP COLUMN "neighborhood_id"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "address"`);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
		await queryRunner.query(
			`ALTER TABLE "users" DROP CONSTRAINT "UQ_230b925048540454c8b4c481e1c"`,
		);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cpf"`);
		await queryRunner.query(`DROP TABLE "shippings"`);
		await queryRunner.query(`DROP TABLE "sale_products"`);
		await queryRunner.query(`DROP TABLE "reviews"`);
		await queryRunner.query(`DROP TABLE "payments"`);
		await queryRunner.query(`DROP TABLE "sales"`);
		await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."sales_delivery_type_enum"`);
		await queryRunner.query(`DROP TABLE "payment_methods"`);
		await queryRunner.query(`DROP TABLE "messages"`);
		await queryRunner.query(`DROP TABLE "cart_items"`);
		await queryRunner.query(`DROP TABLE "products"`);
		await queryRunner.query(`DROP TABLE "measurement_units"`);
		await queryRunner.query(`DROP TABLE "chats"`);
		await queryRunner.query(`DROP TYPE "public"."chats_status_enum"`);
		await queryRunner.query(`DROP TABLE "categories"`);
		await queryRunner.query(`DROP TABLE "carts"`);
		await queryRunner.query(`DROP TYPE "public"."carts_delivery_type_enum"`);
		await queryRunner.query(`DROP TABLE "sellers"`);
		await queryRunner.query(`DROP TABLE "neighborhoods"`);
	}
}
