import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { DeliveryType, SaleStatus } from "./enums";
import type { Payment } from "./Payment";
import type { Review } from "./Review";
import type { SaleAdjustment } from "./SaleAdjustment";
import type { SaleProduct } from "./SaleProduct";
import type { SaleStatusHistory } from "./SaleStatusHistory";
import { User } from "./User";

@Entity("sales")
export class Sale {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "customer_id" })
	customer_id!: string;

	@ManyToOne(() => User, { onDelete: "RESTRICT" })
	@JoinColumn({ name: "customer_id" })
	customer!: User;

	@Column({
		type: "enum",
		enum: DeliveryType,
		default: DeliveryType.RETIRADA,
	})
	delivery_type!: DeliveryType;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	total_amount!: number;

	// Frete gravado no checkout (VER-91): não muda depois de criado o pedido
	@Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
	shipping_amount!: number;

	// Soma das distâncias de condução dos vendedores com frete por km (nulo = sem distância)
	@Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
	shipping_distance_km!: number | null;

	@Column({
		type: "enum",
		enum: SaleStatus,
		default: SaleStatus.ABERTA,
	})
	status!: SaleStatus;

	@OneToMany("SaleProduct", "sale", { cascade: true })
	items!: SaleProduct[];

	@OneToMany("Payment", "sale")
	payments!: Payment[];

	@OneToMany("Review", "sale")
	reviews!: Review[];

	@OneToMany("SaleAdjustment", "sale")
	adjustments!: SaleAdjustment[];

	@OneToMany("SaleStatusHistory", "sale")
	status_history!: SaleStatusHistory[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
