import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { mlTokensTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const ML_CLIENT_ID = process.env.ML_CLIENT_ID || "";
const ML_CLIENT_SECRET = process.env.ML_CLIENT_SECRET || "";
const ML_REDIRECT_URI = process.env.ML_REDIRECT_URI || "";

router.get("/connect", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    if (!ML_CLIENT_ID) {
      res.status(500).json({ error: "config", message: "ML_CLIENT_ID não configurado" });
      return;
    }

    const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64");
    const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${encodeURIComponent(ML_REDIRECT_URI)}&state=${state}`;

    res.json({ url });
  } catch (err) {
    req.log.error({ err }, "ML OAuth connect error");
    res.status(500).json({ error: "internal", message: "Erro interno" });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query as { code: string; state: string };

    if (!code || !state) {
      res.status(400).json({ error: "validation", message: "Código ou state ausentes" });
      return;
    }

    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const userId = parseInt(stateData.userId);

    const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ML_CLIENT_ID,
        client_secret: ML_CLIENT_SECRET,
        code,
        redirect_uri: ML_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      req.log.error({ errText }, "ML token exchange failed");
      res.status(400).json({ error: "oauth", message: "Falha ao obter token do Mercado Livre" });
      return;
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user_id: number;
    };

    const userResponse = await fetch(`https://api.mercadolibre.com/users/${tokenData.user_id}`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let nickname = null;
    if (userResponse.ok) {
      const userData = await userResponse.json() as { nickname: string };
      nickname = userData.nickname;
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    const existing = await db.select().from(mlTokensTable).where(eq(mlTokensTable.userId, userId)).limit(1);

    if (existing.length > 0) {
      await db.update(mlTokensTable).set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        mlUserId: tokenData.user_id.toString(),
        mlNickname: nickname,
        updatedAt: new Date(),
      }).where(eq(mlTokensTable.userId, userId));
    } else {
      await db.insert(mlTokensTable).values({
        userId,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        mlUserId: tokenData.user_id.toString(),
        mlNickname: nickname,
        updatedAt: new Date(),
      });
    }

    res.json({ connected: true, nickname, mlUserId: tokenData.user_id.toString() });
  } catch (err) {
    req.log.error({ err }, "ML OAuth callback error");
    res.status(500).json({ error: "internal", message: "Erro interno" });
  }
});

router.get("/status", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    const [token] = await db.select().from(mlTokensTable).where(eq(mlTokensTable.userId, userId)).limit(1);

    if (!token) {
      res.json({ connected: false, nickname: null, mlUserId: null });
      return;
    }

    res.json({
      connected: true,
      nickname: token.mlNickname,
      mlUserId: token.mlUserId,
    });
  } catch (err) {
    req.log.error({ err }, "ML OAuth status error");
    res.status(500).json({ error: "internal", message: "Erro interno" });
  }
});

router.delete("/disconnect", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    await db.delete(mlTokensTable).where(eq(mlTokensTable.userId, userId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "ML OAuth disconnect error");
    res.status(500).json({ error: "internal", message: "Erro interno" });
  }
});

export default router;
