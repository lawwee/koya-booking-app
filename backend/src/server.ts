import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';

import { connectDB } from './config/database.config.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const start = async () => {
    await connectDB();

    app.get('/', (request, response) => {
        response.send('Hello, Koya!');
    });

    app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
        response.status(500).json({ error: error.message || 'Internal Server Error' });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

start();

