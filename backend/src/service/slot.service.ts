import { db as prisma } from "../config/database.config";
import { SlotDto } from "../dtos/slot.dto";
import type { Slot } from "../../generated/prisma/client";

export class SlotService {
    private mapSlotToDto(slot: Slot): SlotDto {
        return new SlotDto({
            id: slot.id,
            provider: slot.provider,
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
            available: slot.available,
            createdAt: slot.createdAt.toISOString(),
            updatedAt: slot.updatedAt.toISOString(),
        });
    }

    async allSlots(): Promise<SlotDto[]> {
        const slots = await prisma.slot.findMany({
            orderBy: { start: "asc" },
        });

        return slots.map((slot) => this.mapSlotToDto(slot));
    }
}
