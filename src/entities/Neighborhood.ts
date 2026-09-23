import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity("neighborhoods")
export class Neighborhood {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "varchar", length: 100 })
	name!: string;

	@Column({ type: "varchar", length: 100 })
	city!: string;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
