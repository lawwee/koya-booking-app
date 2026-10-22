import express from "express";
import slotRoute from "./slot.route";
import bookingRoute from "./booking.route";

const router = express.Router();

router.use("/slots", slotRoute);
router.use("/bookings", bookingRoute);

export default router;