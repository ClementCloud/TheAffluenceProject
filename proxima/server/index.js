import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import planRoutes from "./routes/planRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import goalsRoutes from "./routes/goalsRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 