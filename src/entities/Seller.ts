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

	// Origem do frete por quilômetro (VER-91): ponto da propriedade rural.
	// Sem origem configurada, o frete usa a taxa fixa antiga (users.fixed_shipping_rate).
	@Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
	latitude!: number | null;

	@Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
	longitude!: number | null;

	@Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
	shipping_base_fee!: number;

	@Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
	shipping_price_per_km!: number;

	// Nulo = sem limite de distância para entrega
	@Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
	max_delivery_radius_km!: number | null;

	@OneToMany("Shipping", "seller")
	shippings!: Shipping[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
