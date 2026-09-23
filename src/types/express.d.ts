import type { UserRole } from "@/entities/enums";

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				role: UserRole;
			};
		}
	}
}
