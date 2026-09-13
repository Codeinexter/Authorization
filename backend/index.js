import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from "path";
import { connectDB } from './db/connectDB.js';
import authRoutes from './routes/auth.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    "http://localhost:5173",
    "http://localhost:3000",
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is listening to port ${PORT}!`);
});