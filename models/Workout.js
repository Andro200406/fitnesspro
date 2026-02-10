import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema({
  name: String,
  reps: Number,
  target: Number,
  calories: Number,
  hr: Number,
  fatigue: Number,
  stress: Number,
});

const VitalsSchema = new mongoose.Schema({
  heart_rate: Number,
  breath_rate: Number,
  spo2: Number,
  skin_temp: Number,
  bp: String,
  intensity: String,
});

const WorkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workoutName: String,
    duration: Number,
    accuracy: Number,

    totalCalories: Number,
    totalReps: Number,

    exercises: [ExerciseSchema],
    vitals: VitalsSchema,
  },
  { timestamps: true } // 👈 gives createdAt automatically
);

export default mongoose.model("Workout", WorkoutSchema);