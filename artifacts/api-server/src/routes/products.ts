import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    const products = await db.select().from(productsTable).where(eq(productsTable.userId, userId));
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Get products error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, name, sku, description, price, stockQuantity, category, imageUrl } = req.body;

    if (!userId || !name || !sku || !price) {
      res.status(400).json({ error: "validation", message: "Campos obrigatórios ausentes" });
      return;
    }

    const [product] = await db.insert(productsTable).values({
      userId,
      name,
      sku,
      description: description || null,
      price: price.toString(),
      stockQuantity: stockQuantity || 0,
      category: category || null,
      imageUrl: imageUrl || null,
    }).returning();

    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, sku, description, price, stockQuantity, category } = req.body;

    const [product] = await db.update(productsTable)
      .set({
        name,
        sku,
        description: description || null,
        price: price.toString(),
        stockQuantity,
        category: category || null,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "not_found", message: "Produto não encontrado" });
      return;
    }

    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string);
    if (!userId) {
      res.status(400).json({ error: "validation", message: "userId is required" });
      return;
    }

    const products = await db.select().from(productsTable).where(eq(productsTable.userId, userId));
    
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= 5).length;
    const syncedPlatforms = products.filter(p => p.mercadoLivreId || p.shopeeId || p.amazonId).length;

    res.json({
      totalProducts,
      totalStock,
      lowStockCount,
      syncedPlatforms,
      recentSyncs: [],
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard error");
    res.status(500).json({ error: "internal", message: "Erro interno do servidor" });
  }
});

export default router;
