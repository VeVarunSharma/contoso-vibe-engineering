import { Router, type Router as RouterType } from "express";

const router: Router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
