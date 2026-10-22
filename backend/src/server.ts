import "dotenv/config";
import { timingSafeEqual } from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";

import { connectDB } from "./config/database.config";
import apiRoutes from "./routes/index.route";
import { HttpError } from "./utils/http-error";

const configuredApiKey = process.env.API_KEY;
if (!configuredApiKey) {
    console.error("API_KEY is not set");
    process.exit(1);
}
const apiKey: string = configuredApiKey;

function apiKeyMatches(provided: string): boolean {
    const providedKey = Buffer.from(provided);
    const expectedKey = Buffer.from(apiKey);
    if (providedKey.length !== expectedKey.length) {
        return false;
    }
    return timingSafeEqual(providedKey, expectedKey);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((request, response, next) => {
    const provided = request.header("x-api-key");
    if (!provided || !apiKeyMatches(provided)) {
        response.status(401).json({ error: "Unauthorized" });
        return;
    }
    next();
});

const start = async () => {
    await connectDB();

    app.get('/', (request, response) => {
        response.send('Hello, Koya!');
    });

    app.use('/api', apiRoutes);

    app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
        const message = error instanceof Error && error.message.length > 0
            ? error.message
            : "Internal Server Error";
        const statusCode = error instanceof HttpError ? error.statusCode : 500;
        response.status(statusCode).json({ error: message });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

start();

