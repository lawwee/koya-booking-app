import express from "express";

import slotRoute from "./slot.route";
import bookingRoute from "./booking.route";
import resetRoute from "./reset.route";

const router = express.Router();

router.use("/slots", slotRoute);
router.use("/bookings", bookingRoute);
router.use("/reset", resetRoute);

export default router;