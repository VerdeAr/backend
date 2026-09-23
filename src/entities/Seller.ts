import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { Shipping } from "./Shipping";
import { User } from "./User";

@Entity("sellers")
export class Seller {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "user_id", unique: true })
	user_id!: string;

	@OneToOne(
		() => User,
		(user) => user.seller,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "user_id" })
	user!: User;

	@Column({ type: "text", nullable: true })
	description!: string | null;

	@Column({ type: "varchar", length: 18, nullable: true })
	cnpj!: string | null;

	@Column({ type: "varchar", length: 150, nullable: true })
	farm_name!: string | null;

	@OneToMany("Shipping", "seller")
	shippings!: Shipping[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
