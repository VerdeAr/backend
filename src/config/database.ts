import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import process from "node:process";
import { Cart } from "@/entities/Cart.js";
import { CartItem } from "@/entities/CartItem.js";
import { Category } from "@/entities/Category.js";
import { Chat } from "@/entities/Chat.js";
import { MeasurementUnit } from "@/entities/MeasurementUnit.js";
import { Message } from "@/entities/Message.js";
import { Neighborhood } from "@/entities/Neighborhood.js";
import { Payment } from "@/entities/Payment.js";
import { PaymentMethod } from "@/entities/PaymentMethod.js";
import { Product } from "@/entities/Product.js";
import { Review } from "@/entities/Review.js";
import { Sale } from "@/entities/Sale.js";
import { SaleAdjustment } from "@/entities/SaleAdjustment.js";
import { SaleAdjustmentItem } from "@/entities/SaleAdjustmentItem.js";
import { SaleProduct } from "@/entities/SaleProduct.js";
import { SaleStatusHistory } from "@/entities/SaleStatusHistory.js";
import { Seller } from "@/entities/Seller.js";
import { Shipping } from "@/entities/Shipping.js";
import { User } from "@/entities/User.js";
import { InitialSchema1790124561841 } from "@/migrations/1790124561841-InitialSchema.js";
import { AddStructuredAddressToUsers1790124600000 } from "@/migrations/1790124600000-AddStructuredAddressToUsers.js";
import { SaleAdjustmentsAndStatusHistory1793827055534 } from "@/migrations/1793827055534-SaleAdjustmentsAndStatusHistory.js";
import { AddDynamicShippingFields1794441600000 } from "@/migrations/1794441600000-AddDynamicShippingFields.js";

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

export const AppDataSource = new DataSource({
	type: "postgres",
	host: DB_HOST,
	port: Number(DB_PORT),
	username: DB_USER,
	password: DB_PASS,
	database: DB_NAME,
	synchronize: false,
	logging: false,
	entities: [
		Cart,
		CartItem,
		Category,
		Chat,
		MeasurementUnit,
		Message,
		Neighborhood,
		Payment,
		PaymentMethod,
		Product,
		Review,
		Sale,
		SaleAdjustment,
		SaleAdjustmentItem,
		SaleProduct,
		SaleStatusHistory,
		Seller,
		Shipping,
		User,
	],
	migrations: [
		InitialSchema1790124561841,
		AddStructuredAddressToUsers1790124600000,
		SaleAdjustmentsAndStatusHistory1793827055534,
		AddDynamicShippingFields1794441600000,
	],
	subscribers: [],
});
