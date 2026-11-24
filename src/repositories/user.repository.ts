import { AppDataSource } from "@/config/database";
import { User } from "@/entities/User";

export const userRepository = AppDataSource.getRepository(User).extend({
	findByEmail(email: string) {
		return this.findOne({ where: { email } });
	},
	findByCpf(cpf: string) {
		return this.findOne({ where: { cpf } });
	},

	/**
	 * Usuário com o hash da senha, para o login conferir a credencial.
	 * O `password` tem `select: false` na entidade, então só vem quando pedido aqui.
	 */
	findByEmailWithPassword(email: string) {
		return this.createQueryBuilder("user")
			.addSelect("user.password")
			.leftJoinAndSelect("user.neighborhood", "neighborhood")
			.leftJoinAndSelect("user.seller", "seller")
			.where("user.email = :email", { email })
			.getOne();
	},

	/** Usuário com o hash da senha, para a troca de senha conferir a senha atual. */
	findByIdWithPassword(id: string) {
		return this.createQueryBuilder("user")
			.addSelect("user.password")
			.where("user.id = :id", { id })
			.getOne();
	},

	/**
	 * Nome e e-mail de vários usuários, para os e-mails transacionais (VER-83).
	 * Carrega só esses campos, sem dados sensíveis.
	 */
	findEmailContactsByIds(ids: string[]) {
		if (ids.length === 0) return Promise.resolve([]);
		return this.createQueryBuilder("user")
			.select(["user.id", "user.name", "user.email"])
			.where("user.id IN (:...ids)", { ids })
			.getMany();
	},
});
