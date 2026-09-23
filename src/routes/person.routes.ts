import { Router } from "express";
import { PersonController } from "@/controllers/person.controller";
import { UserRole } from "@/entities/enums";
import { ensureAuthenticated, ensureRole } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validation.middleware";
import {
	updatePasswordSchema,
	updateProfileSchema,
	updateShippingRateSchema,
} from "@/schemas/person.schema";

const personRoutes = Router();
const controller = new PersonController();

personRoutes.use(ensureAuthenticated);

personRoutes.put(
	"/cadastro",
	validate(updateProfileSchema),
	controller.updateProfile,
);

personRoutes.put(
	"/senha",
	validate(updatePasswordSchema),
	controller.updatePassword,
);

personRoutes.put(
	"/frete",
	ensureRole([UserRole.VENDEDOR]),
	validate(updateShippingRateSchema),
	controller.updateShipping,
);

export { personRoutes };
