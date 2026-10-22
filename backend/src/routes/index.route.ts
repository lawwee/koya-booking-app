import express from "express";
import slotRoute from "./slot.route";

const router = express.Router();

router.use("/slots", slotRoute);

export default router;