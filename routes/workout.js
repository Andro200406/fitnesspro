import express from "express";
import Workout from "../models/Workout.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// SAVE WORKOUT
router.post("/", protect, async (req, res) => {
    try {
        const {
            workoutName, 
            duration,
            accuracy,
            exercises,
            vitals,
        } = req.body;

        const totalCalories = exercises.reduce((s, e) => s + e.calories, 0);
        const totalReps = exercises.reduce((s, e) => s + e.reps, 0);

        const workout = await Workout.create({
            user: req.user._id,
            workoutName,
            duration,
            accuracy,
            exercises,
            vitals,
            totalCalories,
            totalReps,
        });

        res.json(workout);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Workout save failed" });
    }
});


router.get("/latest", protect, async (req, res) => {
    const workout = await Workout.findOne({ user: req.user._id })
        .sort({ createdAt: -1 });

    res.json(workout);
});


router.get("/stats", protect, async (req, res) => {
    const now = new Date();

    const startOfWeek = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - now.getUTCDay(),
        0, 0, 0
    ));

    const workouts = await Workout.find({
        user: req.user._id,
        createdAt: { $gte: startOfWeek },
    }).sort({ createdAt: 1 });

    const totalCalories = workouts.reduce((s, w) => s + w.totalCalories, 0);
    const avgAccuracy =
        workouts.reduce((s, w) => s + w.accuracy, 0) / (workouts.length || 1);

    console.log("Found workouts:", workouts.length);


    res.json({
        workoutsCount: workouts.length,
        totalCalories: Math.round(totalCalories),
        avgAccuracy: Math.round(avgAccuracy),
        workouts,
    });
});



export default router;