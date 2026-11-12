import bcrypt from "bcrypt";
import { AppDataSource } from "@/config/database";
import { UserRole } from "@/entities/enums";
import { Seller } from "@/entities/Seller";
import { AppError } from "@/errors/AppError";
import { userRepository } from "@/repositories/user.repository";
import { extractStructuredAddress } from "@/schemas/address.schema";
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
		if (data.address !== undefined) user.address = data.address;
		if (structured.zip_code !== undefined) user.zip_code = structured.zip_code;
		if (structured.street !== undefined) user.street = structured.street;
		if (structured.number !== undefined) user.number = structured.number;
		if (structured.complement !== undefined)
			user.complement = structured.complement;
		if (structured.neighborhood_name !== undefined)
			user.neighborhood_name = structured.neighborhood_name;
		if (structured.city !== undefined) user.city = structured.city;
		if (structured.state !== undefined) user.state = structured.state;
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

		const sellerRepository = AppDataSource.getRepository(Seller);
		const seller = await sellerRepository.findOne({
			where: { user_id: userId },
		});
		if (!seller) {
			throw new AppError("Perfil de vendedor não encontrado.", 404);
		}

		// Atualiza só o que veio na requisição, sem apagar o restante
		if (data.fixed_shipping_rate !== undefined) {
			user.fixed_shipping_rate = data.fixed_shipping_rate;
			await userRepository.save(user);
		}

		if (data.shipping_base_fee !== undefined)
			seller.shipping_base_fee = data.shipping_base_fee;
		if (data.shipping_price_per_km !== undefined)
			seller.shipping_price_per_km = data.shipping_price_per_km;
		if (data.max_delivery_radius_km !== undefined)
			seller.max_delivery_radius_km = data.max_delivery_radius_km;
		if (data.latitude !== undefined) seller.latitude = data.latitude;
		if (data.longitude !== undefined) seller.longitude = data.longitude;
		await sellerRepository.save(seller);

		const toNumberOrNull = (value: number | string | null) =>
			value === null ? null : Number(value);

		return {
			message: "Frete atualizado com sucesso!",
			fixed_shipping_rate: toNumberOrNull(user.fixed_shipping_rate),
			shipping_base_fee: Number(seller.shipping_base_fee),
			shipping_price_per_km: Number(seller.shipping_price_per_km),
			max_delivery_radius_km: toNumberOrNull(seller.max_delivery_radius_km),
			latitude: toNumberOrNull(seller.latitude),
			longitude: toNumberOrNull(seller.longitude),
			pricing_mode:
				seller.latitude !== null && seller.longitude !== null
					? "POR_KM"
					: "TAXA_FIXA",
		};
	}
}
