import zod from "zod";

const resetSlotSchema = zod.object({
    id: zod.string("id is required").min(1, "id is required"),
    provider: zod.string("provider is required").trim().min(1, "provider is required"),
    start: zod.coerce.date("start is invalid"),
    end: zod.coerce.date("end is invalid"),
}).refine((slot) => slot.end.getTime() > slot.start.getTime(), {
    message: "end must be after start",
    path: ["end"],
});

export const ResetSchema = zod.object({
    slots: zod.array(resetSlotSchema),
}).refine((body) => new Set(body.slots.map((slot) => slot.id)).size === body.slots.length, {
    message: "id must be unique",
    path: ["slots"],
});

export type ResetSlots = zod.infer<typeof ResetSchema>["slots"];
