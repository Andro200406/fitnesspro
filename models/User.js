import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: { type: String, select: false },

    profile: {
      fullName: String,
      age: Number,
      gender: String,
      height: Number,
      weight: Number,
      fitnessLevel: String,
      goal: String,
      injuries: String,
      conditions: String,

      permissions: {
        camera: { type: Boolean, default: false },
        mic: { type: Boolean, default: false }
      }
    },

    onboardingCompleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
