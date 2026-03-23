import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { syncLogsTable, productsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { userId, platform } = req.body;

    if (!userId || !platform) {
      res.status(400).json({ error: "validation", message: "userId e platform são obrigatórios" });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const statuses = ["success", "success", "success", "partial"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const messages: Record<string, string> = {
      success: `Sincronização com ${platform} concluída com sucesso`,
      partial: `Sincronização parcial com ${platform} - alguns produtos não puderam ser sincronizados`,
    };

    const [syncLog] = await db.insert(syncLogsTable).values({
      userId,
      platform,
      status: randomStatus,
      message: messages[randomStatus] || messages.success,
    }).returning();

    if (randomStatus === "success") {
      const idField = platform === "mercadolivre"
        ? "mercadoLivreId"
        : platform === "shopee"
        ? "shopeeId"
        : "amazonId";

      const products = await db.select().from(productsTable).where(eq(productsTable.userId, userId));
      for (const product of products.slice(0, 5)) {
        const updateData: Record<string, string> = {};
        updateData[idField] = `${platform}-${product.id}-${Date.now()}`;
        await db.update(productsTable)
          .set(updateData as any)
          .where(eq(productsTable.id, product.id));
      }
    }

    res.json({
      platform,
      status: syncLog.status,
      message: syncLog.message,
      syncedAt: syncLog.syncedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Sync error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    const logs = await db.select().from(syncLogsTable)
      .where(eq(syncLogsTable.userId, userId))
      .limit(20);

    res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Get sync logs error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

export default router;
