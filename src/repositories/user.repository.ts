import { AppDataSource } from "@/config/database";
import { User } from "@/entities/User";

export const userRepository = AppDataSource.getRepository(User).extend({
	findByEmail(email: string) {
		return this.findOne({ where: { email } });
	},
	findByCpf(cpf: string) {
		return this.findOne({ where: { cpf } });
	},
});
