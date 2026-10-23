import express from "express";
import zod from "zod";
import { BookingService } from "../service/booking.service";
import { CreateBookingSchema } from "../validation/create-booking.validation";
import { ListBookingsSchema } from "../validation/list-bookings.validation";
import { bookingAttemptRetryAfter } from "../utils/booking-rate-limit.util";
import { emailSchema, handleValidationError, validationErrorMessage } from "../utils/validation.util";
import { hashRequestBody } from "../utils/idempotency.util";
import { HttpError } from "../utils/http-error";

const attemptEmailSchema = zod.object({
    email: zod.string().trim().min(1).toLowerCase().pipe(emailSchema),
});

const router = express.Router();
const bookingService = new BookingService();

function idempotencyKeyFrom(header: string | undefined): string | undefined {
    if (header === undefined) {
        return undefined;
    }
    if (header.trim().length === 0) {
        throw new HttpError("Idempotency-Key is empty", 400);
    }
    return header;
}

router
    .get("/", async (request, response, next) => {
        try {
            const { error, data } = ListBookingsSchema.safeParse(request.query);
            if (error) {
                return handleValidationError(error, response);
            }

            const bookings = await bookingService.listBookings(data);
            response.status(200).json(bookings);
        } catch (error) {
            return next(error);
        }
    })
    .get("/:id", async (request, response, next) => {
        try {
            const id = request.params.id;
            if (typeof id !== "string" || id.length === 0) {
                throw new HttpError("Booking not found", 404);
            }

            const booking = await bookingService.getBooking(id);
            response.status(200).json(booking);
        } catch (error) {
            return next(error);
        }
    })
    .post("/", async (request, response, next) => {
        try {
            const idempotencyKey = idempotencyKeyFrom(request.header("Idempotency-Key"));
            const requestHash = idempotencyKey === undefined ? undefined : hashRequestBody(request.body);
            const idempotency = idempotencyKey !== undefined && requestHash !== undefined
                ? { key: idempotencyKey, requestHash }
                : undefined;
            const attemptEmail = attemptEmailSchema.safeParse(request.body);
            if (attemptEmail.success) {
                const retryAfter = bookingAttemptRetryAfter(attemptEmail.data.email);
                if (retryAfter !== undefined) {
                    response.set("Retry-After", String(retryAfter));
                    response.status(429).json({ error: "Too many booking attempts" });
                    return;
                }
            }

            const { error, data } = CreateBookingSchema.safeParse(request.body);
            
            if (error) {
                if (idempotency) {
                    const result = await bookingService.storeIdempotentResult(idempotency, {
                        statusCode: 400,
                        body: { error: validationErrorMessage(error) },
                    });
                    response.status(result.statusCode).json(result.body);
                    return;
                }
                return handleValidationError(error, response);
            }

            const result = await bookingService.createBooking(data, idempotency);
            response.status(result.statusCode).json(result.body);
        } catch (error) {
            return next(error);
        }
    })
    .delete("/:id", async (request, response, next) => {
        try {
            const id = request.params.id;
            if (typeof id !== "string" || id.length === 0) {
                throw new HttpError("Booking not found", 404);
            }

            const booking = await bookingService.cancelBooking(id);
            response.status(200).json(booking);
        } catch (error) {
            return next(error);
        }
    })


export default router;