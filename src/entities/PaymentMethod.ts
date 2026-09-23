import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity("payment_methods")
export class PaymentMethod {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "varchar", length: 100, unique: true })
	description!: string;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
