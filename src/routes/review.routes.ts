import { Router } from "express";
import { ReviewController } from "@/controllers/review.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";

const reviewRoutes = Router();
const reviewController = new ReviewController();

// Criação exige cliente autenticado; listagens são públicas
reviewRoutes.post("/", ensureAuthenticated, reviewController.create);
reviewRoutes.get("/vendedor/:sellerId", reviewController.getBySeller);
reviewRoutes.get("/produto/:productId", reviewController.getByProduct);

export { reviewRoutes };
