import zod from "zod";

const limitMessage = "limit must be an integer from 1 to 50";

export const ListBookingsSchema = zod.object({
    email: zod.string("email is required").trim().min(1, "email is required").toLowerCase(),
    limit: zod.coerce.number(limitMessage).int(limitMessage).min(1, limitMessage).max(50, limitMessage).default(10),
    cursor: zod.string("cursor is invalid").min(1, "cursor is invalid").optional(),
});

export type ListBookingsQuery = zod.infer<typeof ListBookingsSchema>;
