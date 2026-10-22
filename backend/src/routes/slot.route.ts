import express from "express";
import { SlotService } from "../service/slot.service";

const router = express.Router();
const slotService = new SlotService();

router.get("/", async (request, response, next) => {
    try {
        const slots = await slotService.allSlots();
        response.status(200).json(slots);
    } catch (error) {
        return next(error);
    }
});

export default router;