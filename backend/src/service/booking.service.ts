import { db as prisma } from "../config/database.config";
import { BookingDto, CreateBookingDto } from "../dtos/booking.dto";
import { decodeCursor, encodeCursor } from "../utils/cursor.util";
import { HttpError } from "../utils/http-error";
import type { ListBookingsQuery } from "../validation/list-bookings.validation";
import type { Booking } from "../../generated/prisma/client";

enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
}

type ApiResult = {
    statusCode: number;
    body: unknown;
};

type IdempotencyInput = {
    key: string;
    requestHash: string;
};

export class BookingService {
    private mapBookingToDto(booking: Booking): BookingDto {
        return new BookingDto({
            id: booking.id,
            slot_id: booking.slot_id,
            name: booking.name,
            email: booking.email,
            status: booking.status,
            created_at: booking.createdAt.toISOString(),
        });
    }

    async listBookings(query: ListBookingsQuery) {
        const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
        const bookings = await prisma.booking.findMany({
            where: cursor === undefined
                ? { email: query.email }
                : {
                    email: query.email,
                    OR: [
                        { createdAt: { gt: cursor.createdAt } },
                        { AND: [{ createdAt: cursor.createdAt }, { id: { gt: cursor.id } }] },
                    ],
                },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: query.limit + 1,
        });

        const page = bookings.slice(0, query.limit);
        const last = page.at(-1);
        return {
            bookings: page.map((booking) => ({
                id: booking.id,
                slot_id: booking.slot_id,
                name: booking.name,
                email: booking.email,
                status: booking.status,
                created_at: booking.createdAt.toISOString(),
            })),
            next_cursor: bookings.length > query.limit && last !== undefined
                ? encodeCursor(last)
                : null,
        };
    }

    async storeIdempotentResult(idempotency: IdempotencyInput, result: ApiResult): Promise<ApiResult> {
        return prisma.$transaction(async (tx) => {
            const existing = await this.readIdempotency(tx, idempotency);
            if (existing) {
                return existing;
            }

            await tx.idempotencyRecord.create({
                data: {
                    key: idempotency.key,
                    requestHash: idempotency.requestHash,
                    statusCode: result.statusCode,
                    responseBody: JSON.stringify(result.body),
                },
            });
            return result;
        });
    }

    async createBooking(booking: CreateBookingDto, idempotency?: IdempotencyInput): Promise<ApiResult> {
        try {
            return await prisma.$transaction(async (tx) => {
                if (idempotency) {
                    const existing = await this.readIdempotency(tx, idempotency);
                    if (existing) {
                        return existing;
                    }
                }

                try {
                    const created = await this.insertBooking(tx, booking);
                    const body = this.mapBookingToDto(created);
                    if (idempotency) {
                        await tx.idempotencyRecord.create({
                            data: {
                                key: idempotency.key,
                                requestHash: idempotency.requestHash,
                                statusCode: 201,
                                responseBody: JSON.stringify(body),
                            },
                        });
                    }
                    return { statusCode: 201, body };
                } catch (error) {
                    if (!(error instanceof HttpError) || !idempotency) {
                        throw error;
                    }
                    const body = { error: error.message };
                    await tx.idempotencyRecord.create({
                        data: {
                            key: idempotency.key,
                            requestHash: idempotency.requestHash,
                            statusCode: error.statusCode,
                            responseBody: JSON.stringify(body),
                        },
                    });
                    return { statusCode: error.statusCode, body };
                }
            });
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error(error);
            throw new HttpError("error creating booking", 500);
        }
    }

    async cancelBooking(id: string): Promise<BookingDto> {
        try {
            const cancelled = await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findUnique({
                    where: { id },
                });

                if (!booking) {
                    throw new HttpError("Booking not found", 404);
                }

                if (booking.status === BookingStatus.CANCELLED) {
                    throw new HttpError("Booking is already cancelled", 400);
                }

                const updated = await tx.booking.update({
                    where: { id },
                    data: {
                        status: BookingStatus.CANCELLED,
                    },
                });

                await tx.slot.update({
                    where: { id: booking.slot_id },
                    data: { available: true },
                });

                return updated;
            });

            return this.mapBookingToDto(cancelled);
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error(error);
            throw new HttpError("error cancelling booking", 500);
        }
    }

    async getBooking(id: string): Promise<BookingDto> {
        try {
            const booking = await prisma.booking.findUnique({
                where: { id },
            });

            if (!booking) {
                throw new HttpError("Booking not found", 404);
            }

            return this.mapBookingToDto(booking);
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error(error);
            throw new HttpError("error getting booking", 500);
        }
    }

    private async readIdempotency(
        tx: Pick<typeof prisma, "idempotencyRecord">,
        idempotency: IdempotencyInput,
    ): Promise<ApiResult | undefined> {
        const existing = await tx.idempotencyRecord.findUnique({
            where: { key: idempotency.key },
        });
        if (!existing) {
            return undefined;
        }
        if (existing.requestHash !== idempotency.requestHash) {
            throw new HttpError("Idempotency key was used with a different request body", 422);
        }
        return {
            statusCode: existing.statusCode,
            body: JSON.parse(existing.responseBody) as unknown,
        };
    }

    private async insertBooking(
        tx: Pick<typeof prisma, "slot" | "booking">,
        booking: CreateBookingDto,
    ): Promise<Booking> {
        const slot = await tx.slot.findUnique({
            where: { id: booking.slot_id },
        });

        if (!slot) {
            throw new HttpError("Slot not found", 404);
        }

        if (slot.start.getTime() <= Date.now()) {
            throw new HttpError("Slot has already started", 400);
        }

        const claimed = await tx.slot.updateMany({
            where: {
                id: booking.slot_id,
                available: true,
            },
            data: {
                available: false,
            },
        });

        if (claimed.count !== 1) {
            throw new HttpError("Slot is no longer available", 409);
        }

        return tx.booking.create({
            data: {
                id: crypto.randomUUID(),
                slot_id: booking.slot_id,
                name: booking.name,
                email: booking.email,
                status: BookingStatus.CONFIRMED,
            },
        });
    }
}
