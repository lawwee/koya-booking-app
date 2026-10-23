import express from "express";
import { SlotService } from "../service/slot.service";
import { handleValidationError } from "../utils/validation.util";
import { ListSlotsSchema } from "../validation/list-slots.validation";

const router = express.Router();
const slotService = new SlotService();

router.get("/", async (request, response, next) => {
    try {
        const { error, data } = ListSlotsSchema.safeParse(request.query);
        if (error) {
            return handleValidationError(error, response);
        }

        const slots = await slotService.allSlots(data.provider);
        response.status(200).json(slots);
    } catch (error) {
        return next(error);
    }
});

export default router;