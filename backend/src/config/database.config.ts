import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to the database successfully!');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    };
};

export const db = prisma;