import bcrypt from "bcrypt";
import { AppDataSource } from "@/config/database";
import { UserRole } from "@/entities/enums";
import { Seller } from "@/entities/Seller";
import { AppError } from "@/errors/AppError";
import { userRepository } from "@/repositories/user.repository";
import type {
	UpdatePasswordInput,
	UpdateProfileInput,
	UpdateShippingRateInput,
} from "@/schemas/person.schema";

export class PersonService {
	async updateProfile(userId: string, data: UpdateProfileInput) {
		const user = await userRepository.findOne({
			where: { id: userId },
			relations: { neighborhood: true, seller: true },
		});

		if (!user) {
			throw new AppError("Usuário não encontrado.", 404);
		}

		if (data.name !== undefined) user.name = data.name;
		if (data.phone !== undefined) user.phone = data.phone;
		if (data.address !== undefined) user.address = data.address;
		if (data.neighborhood_id !== undefined)
			user.neighborhood_id = data.neighborhood_id;

		await userRepository.save(user);

		if (user.role === UserRole.VENDEDOR) {
			const sellerRepo = AppDataSource.getRepository(Seller);
			let seller = await sellerRepo.findOne({ where: { user_id: user.id } });

			if (!seller) {
				seller = sellerRepo.create({ user_id: user.id });
			}

			if (data.description !== undefined) seller.description = data.description;
			if (data.farm_name !== undefined) seller.farm_name = data.farm_name;

			await sellerRepo.save(seller);
		}

		const updatedUser = await userRepository.findOne({
			where: { id: userId },
			relations: { neighborhood: true, seller: true },
		});

		const { password: _, ...userWithoutPassword } = updatedUser!;
		return {
			message: "Cadastro atualizado com sucesso!",
			user: userWithoutPassword,
		};
	}

	async updatePassword(userId: string, data: UpdatePasswordInput) {
		const user = await userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new AppError("Usuário não encontrado.", 404);
		}

		const passwordMatch = await bcrypt.compare(
			data.current_password,
			user.password,
		);
		if (!passwordMatch) {
			throw new AppError("A senha atual informada está incorreta.", 400);
		}

		user.password = await bcrypt.hash(data.new_password, 10);
		await userRepository.save(user);

		return {
			message: "Senha redefinida com sucesso!",
		};
	}

	async updateShippingRate(userId: string, data: UpdateShippingRateInput) {
		const user = await userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new AppError("Usuário não encontrado.", 404);
		}

		if (user.role !== UserRole.VENDEDOR) {
			throw new AppError("Apenas vendedores podem configurar frete.", 403);
		}

		user.fixed_shipping_rate = data.fixed_shipping_rate;
		await userRepository.save(user);

		return {
			message: "Frete atualizado com sucesso!",
			fixed_shipping_rate: user.fixed_shipping_rate,
		};
	}
}
