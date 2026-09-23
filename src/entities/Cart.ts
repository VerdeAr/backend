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
import type { CartItem } from "./CartItem";
import { DeliveryType } from "./enums";
import { User } from "./User";

@Entity("carts")
export class Cart {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "user_id", unique: true })
	user_id!: string;

	@OneToOne(() => User, { onDelete: "CASCADE" })
	@JoinColumn({ name: "user_id" })
	user!: User;

	@Column({
		type: "enum",
		enum: DeliveryType,
		nullable: true,
	})
	delivery_type!: DeliveryType | null;

	@Column({ type: "varchar", length: 100, nullable: true })
	payment_method!: string | null;

	@OneToMany("CartItem", "cart", { cascade: true })
	items!: CartItem[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
