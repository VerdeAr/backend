import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Product } from "./Product";
import type { Sale } from "./Sale";

@Entity("sale_products")
export class SaleProduct {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "sale_id" })
	sale_id!: string;

	@ManyToOne("Sale", "items", { onDelete: "CASCADE" })
	@JoinColumn({ name: "sale_id" })
	sale!: Sale;

	@Column({ type: "uuid", name: "product_id" })
	product_id!: string;

	@ManyToOne(() => Product, { onDelete: "RESTRICT" })
	@JoinColumn({ name: "product_id" })
	product!: Product;

	@Column({ type: "decimal", precision: 10, scale: 3 })
	quantity!: number;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	unit_price!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
