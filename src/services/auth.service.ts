import process from "node:process";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userRepository } from "@/repositories/user.repository";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";

export class AuthService {
	async register(data: RegisterInput) {
		const userExists = await userRepository.findByEmail(data.email);
		if (userExists) {
			throw new Error("E-mail já está em uso.");
		}

		const hashedPassword = await bcrypt.hash(data.password, 10);
		const user = userRepository.create({
			name: data.name,
			email: data.email,
			password: hashedPassword,
		});

		await userRepository.save(user);
		const { password: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	async login(data: LoginInput) {
		const user = await userRepository.findByEmail(data.email);
		if (!user) {
			throw new Error("Credenciais inválidas.");
		}

		const passwordMatch = await bcrypt.compare(data.password, user.password);
		if (!passwordMatch) {
			throw new Error("Credenciais inválidas.");
		}

		const secret = process.env.JWT_SECRET!;
		const token = jwt.sign({ id: user.id }, secret, { expiresIn: "1d" });

		return { token };
	}

	async getProfile(userId: string) {
		const user = await userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new Error("Usuário não encontrado.");
		}

		const { password: _, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}
