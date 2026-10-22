import zod from "zod";
import { emailSchema } from "../utils/validation.util";

export const CreateBookingSchema = zod.object({
    slot_id: zod.string("slot_id is required").min(1, "slot_id is required"),
    name: zod.string("name is required").min(1, "name is required"),
    email: emailSchema,
});
