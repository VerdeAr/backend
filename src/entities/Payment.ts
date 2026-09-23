import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { PaymentMethod } from "./PaymentMethod";
import { Sale } from "./Sale";

@Entity("payments")
export class Payment {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "sale_id" })
	sale_id!: string;

	@ManyToOne(
		() => Sale,
		(sale) => sale.payments,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "sale_id" })
	sale!: Sale;

	@Column({ type: "uuid", name: "payment_method_id", nullable: true })
	payment_method_id!: string | null;

	@ManyToOne(() => PaymentMethod, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "payment_method_id" })
	payment_method!: PaymentMethod | null;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	amount!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
