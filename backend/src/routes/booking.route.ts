import express from "express";
import { BookingService } from "../service/booking.service";
import { CreateBookingSchema } from "../validation/create-booking.validation";
import { handleValidationError } from "../utils/validation.util";
import { HttpError } from "../utils/http-error";

const router = express.Router();
const bookingService = new BookingService();

router
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
            const { error, data } = CreateBookingSchema.safeParse(request.body);
            
            if (error) {
                return handleValidationError(error, response);
            }
    
            const booking = await bookingService.createBooking(data);
            response.status(201).json(booking);
    
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