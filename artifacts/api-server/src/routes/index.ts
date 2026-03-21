import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/sync", syncRouter);

export default router;
