import zod from "zod";

export const ListSlotsSchema = zod.object({
    provider: zod.string("provider is invalid").trim().min(1, "provider is invalid").optional(),
});

export type ListSlotsQuery = zod.infer<typeof ListSlotsSchema>;
