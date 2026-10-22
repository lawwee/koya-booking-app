import { type Response } from "express";
import { z, type ZodError } from "zod";

export const emailSchema = z.email("Enter a valid email address");

export function handleValidationError(error: ZodError, response: Response) {
    const message = error.issues
        .map((issue) => {
            const field = issue.path.map(String).join(".");
            return field.length > 0 ? `${field}: ${issue.message}` : issue.message;
        })
        .join("; ");

    return response.status(400).json({
        error: message.length > 0 ? message : "Validation failed",
    });
}
