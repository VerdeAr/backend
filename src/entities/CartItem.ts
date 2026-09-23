import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import type { Cart } from "./Cart";
import { Product } from "./Product";

@Entity("cart_items")
export class CartItem {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: "uuid", name: "cart_id" })
	cart_id!: string;

	@ManyToOne("Cart", "items", { onDelete: "CASCADE" })
	@JoinColumn({ name: "cart_id" })
	cart!: Cart;

	@Column({ type: "uuid", name: "product_id" })
	product_id!: string;

	@ManyToOne(() => Product, { onDelete: "CASCADE" })
	@JoinColumn({ name: "product_id" })
	product!: Product;

	@Column({ type: "decimal", precision: 10, scale: 3, default: 1.0 })
	quantity!: number;

	@Column({ type: "decimal", precision: 10, scale: 2 })
	price!: number;

	@CreateDateColumn()
	created_at!: Date;

	@UpdateDateColumn()
	updated_at!: Date;
}
