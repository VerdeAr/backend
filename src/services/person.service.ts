import bcrypt from "bcrypt";
import { AppDataSource } from "@/config/database";
import { UserRole } from "@/entities/enums";
import { Seller } from "@/entities/Seller";
import { AppError } from "@/errors/AppError";
import { userRepository } from "@/repositories/user.repository";
import {
	composeLegacyAddress,
	extractStructuredAddress,
} from "@/schemas/address.schema";
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

		const structured = extractStructuredAddress(
			data as Record<string, unknown>,
		);

		if (data.name !== undefined) user.name = data.name;
		if (data.phone !== undefined) user.phone = data.phone;
		if (structured.zip_code !== undefined) user.zip_code = structured.zip_code;
		if (structured.street !== undefined) user.street = structured.street;
		if (structured.number !== undefined) user.number = structured.number;
		if (structured.complement !== undefined)
			user.complement = structured.complement;
		if (structured.neighborhood_name !== undefined)
			user.neighborhood_name = structured.neighborhood_name;
		if (structured.city !== undefined) user.city = structured.city;
		if (structured.state !== undefined) user.state = structured.state;

		// O texto legado `address` é derivado do endereço estruturado (fonte de verdade).
		// Se algum campo estruturado veio na requisição, recompõe o texto a partir do
		// resultado final; o `address` enviado sozinho (formato antigo) segue aceito.
		const structuredChanged = Object.keys(structured).length > 0;
		if (structuredChanged) {
			user.address =
				composeLegacyAddress(user) ??
				(data.address !== undefined ? data.address : null);
		} else if (data.address !== undefined) {
			user.address = data.address;
		}
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
