import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Sale } from "./Sale";
import { User } from "./User";

@Entity("reviews")
export class Review {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "sale_id" })
	sale_id!: string;

	@ManyToOne(
		() => Sale,
		(sale) => sale.reviews,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "sale_id" })
	sale!: Sale;

	@Column({ type: "uuid", name: "customer_id" })
	customer_id!: string;

	@ManyToOne(() => User, { onDelete: "CASCADE" })
	@JoinColumn({ name: "customer_id" })
	customer!: User;

	@Column({ type: "int" })
	rating!: number;

	@Column({ type: "text", nullable: true })
	comment!: string | null;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
