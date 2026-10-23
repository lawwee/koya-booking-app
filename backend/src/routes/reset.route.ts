import express from "express";
import { ResetService } from "../service/reset.service";
import { handleValidationError } from "../utils/validation.util";
import { ResetSchema } from "../validation/reset.validation";

const router = express.Router();
const resetService = new ResetService();

router.post("/", async (request, response, next) => {
    try {
        const { error, data } = ResetSchema.safeParse(request.body);
        if (error) {
            return handleValidationError(error, response);
        }

        await resetService.reset(data.slots);
        response.status(200).json({ message: "Done" });
    } catch (error) {
        return next(error);
    }
});

export default router;
