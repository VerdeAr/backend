import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category";
import { MeasurementUnit } from "./MeasurementUnit";
import { Seller } from "./Seller";

@Entity("products")
export class Product {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "seller_id" })
	seller_id!: string;

	@ManyToOne(() => Seller, { onDelete: "CASCADE" })
	@JoinColumn({ name: "seller_id" })
	seller!: Seller;

	@Column({ type: "uuid", name: "category_id", nullable: true })
	category_id!: string | null;

	@ManyToOne(() => Category, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "category_id" })
	category!: Category | null;

	@Column({ type: "uuid", name: "measurement_unit_id", nullable: true })
	measurement_unit_id!: string | null;

	@ManyToOne(() => MeasurementUnit, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "measurement_unit_id" })
	measurement_unit!: MeasurementUnit | null;

	@Column({ type: "varchar", length: 255 })
	name!: string;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	price!: number;

	@Column({ type: "boolean", default: true })
	is_active!: boolean;

	@Column({ type: "varchar", length: 500, nullable: true })
	image_url!: string | null;

	@Column({ type: "decimal", precision: 10, scale: 3, default: 0.0 })
	stock!: number;

	@Column({ type: "text", nullable: true })
	description!: string | null;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
