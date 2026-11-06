import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { SaleAdjustment } from "./SaleAdjustment";
import { SaleProduct } from "./SaleProduct";

// Item afetado por uma proposta de ajuste, com os valores atuais e os propostos
@Entity("sale_adjustment_items")
export class SaleAdjustmentItem {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "adjustment_id" })
	adjustment_id!: string;

	@ManyToOne("SaleAdjustment", "items", { onDelete: "CASCADE" })
	@JoinColumn({ name: "adjustment_id" })
	adjustment!: SaleAdjustment;

	@Column({ type: "uuid", name: "sale_product_id" })
	sale_product_id!: string;

	@ManyToOne(() => SaleProduct, { onDelete: "CASCADE" })
	@JoinColumn({ name: "sale_product_id" })
	sale_product!: SaleProduct;

	@Column({ type: "decimal", precision: 10, scale: 3 })
	original_quantity!: number;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	original_unit_price!: number;

	@Column({ type: "decimal", precision: 10, scale: 3 })
	proposed_quantity!: number;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	proposed_unit_price!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
