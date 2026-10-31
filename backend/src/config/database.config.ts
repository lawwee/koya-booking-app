import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 20_000,
});

const prisma = new PrismaClient({ adapter });

function databaseIsWaking(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes("Can't reach database server")
        || message.includes("ECONNREFUSED")
        || message.includes("ETIMEDOUT")
        || message.includes("timeout expired")
        || message.includes("Connection terminated");
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 5; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!databaseIsWaking(error) || attempt === 5) {
                throw error;
            }
            await wait(2000);
        }
    }
    throw lastError;
}

export const db = prisma.$extends({
    query: {
        $allModels: {
            $allOperations({ args, query }) {
                return withDatabaseRetry(() => query(args));
            },
        },
    },
});

export const connectDB = async () => {
    try {
        await withDatabaseRetry(async () => {
            await prisma.$connect();
            await prisma.$queryRaw`SELECT 1`;
        });
        console.log("Connected to the database successfully!");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
};
