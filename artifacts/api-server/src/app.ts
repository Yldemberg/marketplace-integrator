import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 ADICIONE ISSO AQUI (LOG + ENVIO PARA N8N)
app.use(async (req, res, next) => {
  try {
    console.log("REQ RECEBIDA:", req.method, req.originalUrl);

    await fetch("https://primary-production-8e04b.up.railway.app/webhook/feedback_pergunta_cliente", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: req.method,
        path: req.originalUrl,
      }),
    });
  } catch (err) {
    console.error("Erro ao enviar pro n8n:", err);
  }

  next();
});

// 👇 suas rotas continuam iguais
app.use("/api", router);

export default app;