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
import { ChatStatus } from "./enums";
import type { Message } from "./Message";
import { Seller } from "./Seller";
import { User } from "./User";

@Entity("chats")
export class Chat {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "customer_id" })
	customer_id!: string;

	@ManyToOne(() => User, { onDelete: "CASCADE" })
	@JoinColumn({ name: "customer_id" })
	customer!: User;

	@Column({ type: "uuid", name: "seller_id" })
	seller_id!: string;

	@ManyToOne(() => Seller, { onDelete: "CASCADE" })
	@JoinColumn({ name: "seller_id" })
	seller!: Seller;

	@Column({
		type: "enum",
		enum: ChatStatus,
		default: ChatStatus.ATIVO,
	})
	status!: ChatStatus;

	@Column({ type: "timestamp", nullable: true })
	last_message_at!: Date | null;

	@OneToMany("Message", "chat")
	messages!: Message[];

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
