import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";
import connectDB from "./config/db.js";

const app = express();

// 🔹 Middlewares
app.use(cookieParser());
app.use(express.json()); // for parsing JSON request body
app.use(express.urlencoded({ extended: true })); // <-- for form data
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // allow cookies
}));
connectDB()
// 🔹 Routes
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRouter);

// 🔹 Error handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

// 🔹 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
