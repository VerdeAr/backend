import { neighborhoodRepository } from "@/repositories/neighborhood.repository";

export class NeighborhoodService {
	async listAll() {
		return neighborhoodRepository.findAllOrdered();
	}
}
