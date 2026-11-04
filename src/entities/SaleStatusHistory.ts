import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { SaleStatus } from "./enums";
import type { Sale } from "./Sale";
import { User } from "./User";

// Linha do tempo de status do pedido, exibida no detalhe do pedido (RF-54)
@Entity("sale_status_history")
export class SaleStatusHistory {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "sale_id" })
	sale_id!: string;

	@ManyToOne("Sale", "status_history", { onDelete: "CASCADE" })
	@JoinColumn({ name: "sale_id" })
	sale!: Sale;

	@Column({ type: "enum", enum: SaleStatus, enumName: "sales_status_enum" })
	status!: SaleStatus;

	// Quem fez a mudança (cliente ou vendedor); nulo nos registros migrados
	@Column({ type: "uuid", name: "changed_by_id", nullable: true })
	changed_by_id!: string | null;

	@ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
	@JoinColumn({ name: "changed_by_id" })
	changed_by!: User | null;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
