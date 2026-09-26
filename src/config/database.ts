import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";
import process from "node:process";

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

// Em produção o código compilado fica em dist/, em dev roda direto de src/
const isProd = process.env.NODE_ENV === "production";
const baseDir = isProd ? "dist" : "src";
const ext = isProd ? "js" : "ts";

export const AppDataSource = new DataSource({
	type: "postgres",
	host: DB_HOST,
	port: Number(DB_PORT),
	username: DB_USER,
	password: DB_PASS,
	database: DB_NAME,
	synchronize: false,
	logging: false,
	entities: [`${baseDir}/entities/**/*.${ext}`],
	migrations: [`${baseDir}/migrations/**/*.${ext}`],
	subscribers: [],
});
