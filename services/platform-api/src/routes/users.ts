import { Router, type Router as RouterType } from "express";
import { db } from "../db/index.js";
import { requireBearerToken } from "../middleware/auth.js";

const router: RouterType = Router();

router.use(requireBearerToken);

router.get("/", async (req, res) => {
  try {
    const allUsers = await db.query.users.findMany();
    res.json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
