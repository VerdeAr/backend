import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Neighborhood } from "./Neighborhood";
import { Seller } from "./Seller";

@Entity("shippings")
export class Shipping {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "seller_id" })
	seller_id!: string;

	@ManyToOne(
		() => Seller,
		(seller) => seller.shippings,
		{ onDelete: "CASCADE" },
	)
	@JoinColumn({ name: "seller_id" })
	seller!: Seller;

	@Column({ type: "uuid", name: "neighborhood_id" })
	neighborhood_id!: string;

	@ManyToOne(() => Neighborhood, { onDelete: "CASCADE" })
	@JoinColumn({ name: "neighborhood_id" })
	neighborhood!: Neighborhood;

	@Column({ type: "decimal", precision: 10, scale: 2, default: 0.0 })
	price!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
