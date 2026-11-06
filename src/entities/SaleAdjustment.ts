import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { SaleAdjustmentStatus, SaleStatus } from "./enums";
import type { Sale } from "./Sale";
import type { SaleAdjustmentItem } from "./SaleAdjustmentItem";
import { Seller } from "./Seller";

// Proposta de ajuste de itens ou pesagem feita pelo vendedor (RF-56).
// O índice parcial garante, no banco, no máximo uma proposta PENDENTE por pedido.
@Entity("sale_adjustments")
@Index("UQ_sale_adjustments_pending_sale", ["sale_id"], {
	unique: true,
	where: `"status" = 'PENDENTE'`,
})
export class SaleAdjustment {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "sale_id" })
	sale_id!: string;

	@ManyToOne("Sale", "adjustments", { onDelete: "CASCADE" })
	@JoinColumn({ name: "sale_id" })
	sale!: Sale;

	@Column({ type: "uuid", name: "seller_id" })
	seller_id!: string;

	@ManyToOne(() => Seller, { onDelete: "RESTRICT" })
	@JoinColumn({ name: "seller_id" })
	seller!: Seller;

	@Column({ type: "varchar", length: 500 })
	reason!: string;

	@Column({
		type: "enum",
		enum: SaleAdjustmentStatus,
		default: SaleAdjustmentStatus.PENDENTE,
	})
	status!: SaleAdjustmentStatus;

	// Status do pedido antes da proposta, restaurado quando o cliente aceita
	@Column({
		type: "enum",
		enum: SaleStatus,
		enumName: "sales_status_enum",
		name: "previous_status",
	})
	previous_status!: SaleStatus;

	@Column({ type: "timestamp", name: "responded_at", nullable: true })
	responded_at!: Date | null;

	@OneToMany("SaleAdjustmentItem", "adjustment", { cascade: true })
	items!: SaleAdjustmentItem[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
