import process from "node:process";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "@/config/database";
import type { UserRole } from "@/entities/enums";
import { Seller } from "@/entities/Seller";
import { AppError } from "@/errors/AppError";
import { userRepository } from "@/repositories/user.repository";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";

export class AuthService {
	async register(data: RegisterInput) {
		const emailExists = await userRepository.findByEmail(data.email);
		if (emailExists) {
			throw new AppError("E-mail já está em uso.", 409);
		}

		const cpfExists = await userRepository.findByCpf(data.cpf);
		if (cpfExists) {
			throw new AppError("CPF já cadastrado.", 409);
		}

		const sellerRepo = AppDataSource.getRepository(Seller);
		if (data.role === "VENDEDOR" && data.cnpj) {
			const cnpjExists = await sellerRepo.findOne({
				where: { cnpj: data.cnpj },
			});
			if (cnpjExists) {
				throw new AppError("CNPJ já cadastrado.", 409);
			}
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);
		const user = userRepository.create({
			name: data.name,
			email: data.email,
			password: hashedPassword,
			cpf: data.cpf,
			role: data.role as UserRole,
			phone: data.phone || null,
			address: data.address || null,
			neighborhood_id: data.neighborhood_id || null,
			fixed_shipping_rate: data.role === "VENDEDOR" ? 0.0 : null,
		});

		await userRepository.save(user);

		if (data.role === "VENDEDOR") {
			const seller = sellerRepo.create({
				user_id: user.id,
				description: data.description || null,
				cnpj: data.cnpj || null,
				farm_name: data.farm_name || null,
			});
			await sellerRepo.save(seller);
		}

		const createdUser = await userRepository.findOne({
			where: { id: user.id },
			relations: { neighborhood: true, seller: true },
		});

		const { password: _, ...userWithoutPassword } = createdUser!;
		const secret = process.env.JWT_SECRET!;
		const token = jwt.sign({ id: user.id, role: user.role }, secret, {
			expiresIn: "7d",
		});

		return {
			token,
			user: userWithoutPassword,
		};
	}

	async login(data: LoginInput) {
		const user = await userRepository.findOne({
			where: { email: data.email },
			relations: { neighborhood: true, seller: true },
		});

		if (!user) {
			throw new AppError("Credenciais inválidas.", 401);
		}

		const passwordMatch = await bcrypt.compare(data.password, user.password);
		if (!passwordMatch) {
			throw new AppError("Credenciais inválidas.", 401);
		}

		const secret = process.env.JWT_SECRET!;
		const token = jwt.sign({ id: user.id, role: user.role }, secret, {
			expiresIn: "7d",
		});

		const { password: _, ...userWithoutPassword } = user;
		return {
			token,
			user: userWithoutPassword,
		};
	}

	async getProfile(userId: string) {
		const user = await userRepository.findOne({
			where: { id: userId },
			relations: { neighborhood: true, seller: true },
		});

		if (!user) {
			throw new AppError("Usuário não encontrado.", 404);
		}

		const { password: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}
