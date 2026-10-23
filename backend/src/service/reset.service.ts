import { db as prisma } from "../config/database.config";
import { clearBookingAttempts } from "../utils/booking-rate-limit.util";
import type { ResetSlots } from "../validation/reset.validation";

export class ResetService {
    async reset(slots: ResetSlots): Promise<void> {
        await prisma.$transaction(async (tx) => {
            await tx.booking.deleteMany();
            await tx.idempotencyRecord.deleteMany();
            await tx.slot.deleteMany();
            if (slots.length > 0) {
                await tx.slot.createMany({
                    data: slots.map((slot) => ({
                        id: slot.id,
                        provider: slot.provider,
                        start: slot.start,
                        end: slot.end,
                    })),
                });
            }
        });

        clearBookingAttempts();
    }
}
