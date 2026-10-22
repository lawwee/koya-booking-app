import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';

import { connectDB } from './config/database.config';
import apiRoutes from './routes/index.route';
import { HttpError } from './utils/http-error';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

