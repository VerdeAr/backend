import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity("categories")
export class Category {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "varchar", length: 100, unique: true })
	name!: string;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
