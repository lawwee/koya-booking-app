export class CreateBookingDto {
    slot_id: string;
    name: string;
    email: string;

    constructor(booking: CreateBookingDto) {
        this.slot_id = booking.slot_id;
        this.name = booking.name;
        this.email = booking.email;
    }
}

export class BookingDto {
    id: string;
    slot_id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
    updatedAt: string;

    constructor(booking: BookingDto) {
        this.id = booking.id;
        this.slot_id = booking.slot_id;
        this.name = booking.name;
        this.email = booking.email;
        this.status = booking.status;
        this.createdAt = booking.createdAt;
        this.updatedAt = booking.updatedAt;
    }
}