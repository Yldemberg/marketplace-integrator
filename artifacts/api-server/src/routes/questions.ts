import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { questionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const FEEDBACK_WEBHOOK = "https://primary-production-8e04b.up.railway.app/webhook/feedback_pergunta_cliente";

router.post("/webhook", async (req, res) => {
  try {
    const {
      pergunta,
      resposta,
      status,
      item_id,
      thumbnail,
      permalink,
      loja,
      ml_question_id,
      userId,
    } = req.body;

    if (!pergunta || !status || !item_id || !ml_question_id) {
      res.status(400).json({ error: "validation", message: "Campos obrigatórios ausentes" });
      return;
    }

    const existing = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.mlQuestionId, ml_question_id))
      .limit(1);

    if (existing.length > 0) {
      res.json(existing[0]);
      return;
    }

    const [question] = await db
      .insert(questionsTable)
      .values({
        userId: userId || 1,
        mlQuestionId: ml_question_id,
        pergunta,
        resposta: resposta || null,
        status,
        itemId: item_id,
        thumbnail: thumbnail || null,
        permalink: permalink || null,
        loja: loja || null,
      })
      .returning();

    res.json(question);
  } catch (err) {
    req.log.error({ err }, "Receive question error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    const statusFilter = req.query.status as string | undefined;

    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    let query = db
      .select()
      .from(questionsTable)
      .where(
        statusFilter
          ? and(eq(questionsTable.userId, userId), eq(questionsTable.status, statusFilter))
          : eq(questionsTable.userId, userId)
      );

    const questions = await query;
    res.json(questions);
  } catch (err) {
    req.log.error({ err }, "Get questions error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.post("/:id/answer", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { resposta, userId } = req.body;

    if (!resposta || !resposta.trim()) {
      res.status(400).json({ error: "validation", message: "Resposta é obrigatória" });
      return;
    }

    const [existing] = await db.select().from(questionsTable).where(eq(questionsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "not_found", message: "Pergunta não encontrada" });
      return;
    }

    const [updated] = await db
      .update(questionsTable)
      .set({
        resposta: resposta.trim(),
        status: "ANSWERED",
        answeredAt: new Date(),
      })
      .where(eq(questionsTable.id, id))
      .returning();

    try {
      const webhookPayload = {
        pergunta: updated.pergunta,
        resposta: updated.resposta,
        status: "UNANSWERED",
        item_id: updated.itemId,
        thumbnail: updated.thumbnail,
        permalink: updated.permalink,
        loja: updated.loja,
        ml_question_id: updated.mlQuestionId,
      };

      await fetch(FEEDBACK_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });
    } catch (webhookErr) {
      req.log.warn({ webhookErr }, "Feedback webhook failed - question still marked as answered");
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Answer question error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

export default router;
