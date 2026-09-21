import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDoc } from "@/config/swagger";
import { errorHandler } from "@/middlewares/error.middleware";
import { router } from "@/routes/index";

const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(router);
app.use(errorHandler);

export { app };
