import { AppDataSource } from "@/config/database";
import { SaleProduct } from "@/entities/SaleProduct";

export const saleProductRepository = AppDataSource.getRepository(SaleProduct);
