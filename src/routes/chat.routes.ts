import { Router } from "express";
import { ChatController } from "@/controllers/chat.controller";
import { ensureAuthenticated } from "@/middlewares/auth.middleware";

const chatRoutes = Router();
const chatController = new ChatController();

chatRoutes.use(ensureAuthenticated);

chatRoutes.post("/iniciar", (req, res, next) =>
	chatController.iniciar(req, res, next),
);
chatRoutes.post("/", (req, res, next) =>
	chatController.iniciar(req, res, next),
);
chatRoutes.get("/nao-lidas/count", (req, res, next) =>
	chatController.contarNaoLidas(req, res, next),
);
chatRoutes.get("/", (req, res, next) => chatController.listar(req, res, next));
chatRoutes.get("/:id", (req, res, next) =>
	chatController.obterPorId(req, res, next),
);
chatRoutes.get("/:id/messages", (req, res, next) =>
	chatController.listarMensagens(req, res, next),
);
chatRoutes.post("/:id/messages", (req, res, next) =>
	chatController.enviarMensagem(req, res, next),
);
chatRoutes.patch("/:id/read", (req, res, next) =>
	chatController.marcarLidas(req, res, next),
);
chatRoutes.patch("/:id/finish", (req, res, next) =>
	chatController.finalizar(req, res, next),
);

export { chatRoutes };
