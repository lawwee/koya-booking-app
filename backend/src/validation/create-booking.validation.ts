import zod from "zod";
import { emailSchema } from "../utils/validation.util";

export const CreateBookingSchema = zod.object({
    slot_id: zod.string("slot_id is required").min(1, "slot_id is required"),
    name: zod.string("name is required").trim().min(1, "name is required"),
    email: zod.string("email is required").trim().min(1, "email is required").toLowerCase().pipe(emailSchema),
});
