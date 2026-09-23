import process from "node:process";
import { AppDataSource } from "../config/database";
import {
	Category,
	MeasurementUnit,
	Neighborhood,
	PaymentMethod,
} from "../entities";

async function runSeed() {
	console.log("🌱 Iniciando o seed de dados essenciais...");

	if (!AppDataSource.isInitialized) {
		await AppDataSource.initialize();
	}

	const categoryRepo = AppDataSource.getRepository(Category);
	const unitRepo = AppDataSource.getRepository(MeasurementUnit);
	const paymentRepo = AppDataSource.getRepository(PaymentMethod);
	const neighborhoodRepo = AppDataSource.getRepository(Neighborhood);

	// 1. Categorias
	const categories = [
		"Hortifrúti",
		"Laticínios",
		"Grãos",
		"Pães e Massas",
		"Temperos",
		"Bebidas",
		"Doces",
		"Carnes e Ovos",
	];

	for (const name of categories) {
		const exists = await categoryRepo.findOne({ where: { name } });
		if (!exists) {
			await categoryRepo.save(categoryRepo.create({ name }));
		}
	}
	console.log(`✅ ${categories.length} categorias verificadas/inseridas.`);

	// 2. Unidades de Medida
	const units = [
		{ name: "Quilo", symbol: "kg" },
		{ name: "Grama", symbol: "g" },
		{ name: "Litro", symbol: "L" },
		{ name: "Mililitro", symbol: "ml" },
		{ name: "Unidade", symbol: "un" },
		{ name: "Dúzia", symbol: "dz" },
		{ name: "Pacote", symbol: "pct" },
		{ name: "Caixa", symbol: "cx" },
	];

	for (const unit of units) {
		const exists = await unitRepo.findOne({ where: { name: unit.name } });
		if (!exists) {
			await unitRepo.save(unitRepo.create(unit));
		}
	}
	console.log(`✅ ${units.length} unidades de medida verificadas/inseridas.`);

	// 3. Formas de Pagamento
	const paymentMethods = ["Cartão", "PIX", "Dinheiro", "Boleto"];

	for (const description of paymentMethods) {
		const exists = await paymentRepo.findOne({ where: { description } });
		if (!exists) {
			await paymentRepo.save(paymentRepo.create({ description }));
		}
	}
	console.log(
		`✅ ${paymentMethods.length} formas de pagamento verificadas/inseridas.`,
	);

	// 4. Bairros
	const neighborhoods = [
		{ name: "Centro", city: "Cornélio Procópio" },
		{ name: "Jardim Progresso", city: "Cornélio Procópio" },
		{ name: "Vila Nova", city: "Cornélio Procópio" },
		{ name: "Jardim Primavera", city: "Cornélio Procópio" },
		{ name: "Vila Santa Terezinha", city: "Cornélio Procópio" },
		{ name: "Zona Rural", city: "Cornélio Procópio" },
	];

	for (const neighborhood of neighborhoods) {
		const exists = await neighborhoodRepo.findOne({
			where: { name: neighborhood.name, city: neighborhood.city },
		});
		if (!exists) {
			await neighborhoodRepo.save(neighborhoodRepo.create(neighborhood));
		}
	}
	console.log(`✅ ${neighborhoods.length} bairros verificados/inseridos.`);

	console.log("🌾 Seed finalizado com sucesso!");
}

runSeed()
	.catch((error) => {
		console.error("❌ Erro durante a execução do seed:", error);
		process.exit(1);
	})
	.finally(async () => {
		if (AppDataSource.isInitialized) {
			await AppDataSource.destroy();
		}
	});
