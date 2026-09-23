import { Router } from "express";
import { NeighborhoodController } from "@/controllers/neighborhood.controller";

const neighborhoodRoutes = Router();
const neighborhoodController = new NeighborhoodController();

neighborhoodRoutes.get("/", neighborhoodController.listAll);

export { neighborhoodRoutes };
