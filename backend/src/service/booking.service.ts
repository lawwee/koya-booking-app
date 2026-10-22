import { db as prisma } from "../config/database.config";
import { BookingDto, CreateBookingDto } from "../dtos/booking.dto";
import { HttpError } from "../utils/http-error";
import type { Booking } from "../../generated/prisma/client";

enum BookingStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    CANCELLED = "cancelled",
}

export class BookingService {
    private mapBookingToDto(booking: Booking): BookingDto {
        return new BookingDto({
            id: booking.id,
            slot_id: booking.slot_id,
            name: booking.name,
            email: booking.email,
            status: booking.status,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
        });
    }

    async createBooking(booking: CreateBookingDto): Promise<BookingDto> {
        try {
            const created = await prisma.$transaction(async (tx) => {
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
            });

            return this.mapBookingToDto(created);
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            console.error(error);
            throw new HttpError("error creating booking", 500);
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

}
