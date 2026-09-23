import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./enums";
import { Neighborhood } from "./Neighborhood";
import { Seller } from "./Seller";

@Entity("users")
export class User {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "varchar", length: 150 })
	name!: string;

	@Column({ type: "varchar", length: 150, unique: true })
	email!: string;

	@Column({ type: "varchar" })
	password!: string;

	@Column({ type: "varchar", length: 14, unique: true, nullable: true })
	cpf!: string | null;

	@Column({ type: "varchar", length: 20, nullable: true })
	phone!: string | null;

	@Column({ type: "varchar", length: 255, nullable: true })
	address!: string | null;

	@Column({ type: "uuid", name: "neighborhood_id", nullable: true })
	neighborhood_id!: string | null;

	@ManyToOne(() => Neighborhood, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "neighborhood_id" })
	neighborhood!: Neighborhood | null;

	@Column({
		type: "enum",
		enum: UserRole,
		default: UserRole.CLIENTE,
	})
	role!: UserRole;

	@Column({ type: "boolean", default: true })
	is_active!: boolean;

	@Column({
		type: "decimal",
		precision: 10,
		scale: 2,
		default: 0.0,
		nullable: true,
	})
	fixed_shipping_rate!: number | null;

	@Column({ type: "timestamp", nullable: true })
	last_seen!: Date | null;

	@OneToOne(
		() => Seller,
		(seller) => seller.user,
		{ nullable: true },
	)
	seller!: Seller | null;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
