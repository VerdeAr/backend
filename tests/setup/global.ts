import { execSync } from "node:child_process";
import process from "node:process";
import "./load-env";

// Executado uma vez antes de toda a suíte: prepara o schema e os dados essenciais
export default function setup() {
	const options = {
		stdio: "pipe",
		env: process.env,
		timeout: 120_000,
	} as const;

	execSync("npm run migration:run", options);
	execSync("npm run seed", options);
}
