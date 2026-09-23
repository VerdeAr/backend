import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDoc } from "@/config/swagger";
import { errorHandler } from "@/middlewares/error.middleware";
import { loggingMiddleware } from "@/middlewares/logging.middleware";
import { router } from "@/routes/index";

const app = express();

app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:3000",
			"http://127.0.0.1:5173",
		],
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "Accept"],
	}),
);

app.use(express.json());
app.use(loggingMiddleware);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(router);
app.use(errorHandler);

export { app };
