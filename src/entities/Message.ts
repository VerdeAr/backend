import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { Chat } from "./Chat";
import { User } from "./User";

@Entity("messages")
export class Message {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "chat_id" })
	chat_id!: string;

	@ManyToOne("Chat", "messages", { onDelete: "CASCADE" })
	@JoinColumn({ name: "chat_id" })
	chat!: Chat;

	@Column({ type: "uuid", name: "sender_id" })
	sender_id!: string;

	@ManyToOne(() => User, { onDelete: "CASCADE" })
	@JoinColumn({ name: "sender_id" })
	sender!: User;

	@Column({ type: "text" })
	content!: string;

	@Column({ type: "boolean", default: false })
	is_read!: boolean;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
