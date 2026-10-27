import { Router } from "express";
import { HealthController } from "@/controllers/health.controller";

const healthRoutes = Router();
const healthController = new HealthController();

// Rotas públicas, usadas por healthchecks de contêiner e pelo monitoramento
healthRoutes.get("/health", healthController.live);
healthRoutes.get("/ready", healthController.ready);

export { healthRoutes };
