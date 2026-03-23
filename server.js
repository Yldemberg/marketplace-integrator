const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// WEBHOOK
app.post("/questions/webhook", (req, res) => {
  console.log("WEBHOOK RECEBIDO:", req.body);
  res.sendStatus(200);
});

// TESTE
app.get("/healthz", (req, res) => {
  res.send("ok");
});

// FRONTEND (se existir dist)
app.use(express.static(path.join(__dirname, "dist")));

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
