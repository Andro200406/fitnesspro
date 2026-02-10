import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

import authRoutes from "./routes/auth.js";
import { connectDB } from "./config/db.js";

import workoutRoutes from "./routes/workout.js";
import coachRoutes from "./routes/coach.js";


dotenv.config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// 🔌 MongoDB
connectDB();
// 🔐 Auth routes
app.use("/auth", authRoutes);
app.use("/workouts", workoutRoutes);
app.use("/api/ai", coachRoutes);

app.post("/ml/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No frame received" });
    }

    const { exercise = "Squats", weight = 70, height_cm = 175, age = 30 } = req.body;

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: "image/jpeg",
    });
    form.append("exercise", exercise);
    form.append("weight", String(weight));
    form.append("height_cm", String(height_cm));
    form.append("age", String(age));

    const response = await axios.post(
      "http://127.0.0.1:8000/analyze-frame",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 15000,
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("ML error:", err.response?.data || err.message);
    res.status(500).json({ error: "ML analysis failed" });
  }
});

app.post("/ml/reset", async (req, res) => {
  try {
    const { exercise = "Squats" } = req.body;

    const form = new FormData();
    form.append("exercise", exercise);

    const response = await axios.post(
      "http://127.0.0.1:8000/reset",
      form,
      { headers: form.getHeaders() }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Reset failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);