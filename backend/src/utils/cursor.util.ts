import { HttpError } from "./http-error";

type BookingCursor = {
    createdAt: Date;
    id: string;
};

export function encodeCursor(booking: { createdAt: Date; id: string }): string {
    return Buffer.from(JSON.stringify({
        createdAt: booking.createdAt.toISOString(),
        id: booking.id,
    })).toString("base64url");
}

export function decodeCursor(cursor: string): BookingCursor {
    try {
        const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (typeof parsed !== "object" || parsed === null) {
            throw new Error("invalid cursor");
        }
        const createdAtValue = Reflect.get(parsed, "createdAt");
        const idValue = Reflect.get(parsed, "id");
        if (typeof createdAtValue !== "string" || typeof idValue !== "string" || idValue.length === 0) {
            throw new Error("invalid cursor");
        }
        const createdAt = new Date(createdAtValue);
        if (Number.isNaN(createdAt.getTime())) {
            throw new Error("invalid cursor");
        }
        return { createdAt, id: idValue };
    } catch {
        throw new HttpError("cursor is invalid", 400);
    }
}
