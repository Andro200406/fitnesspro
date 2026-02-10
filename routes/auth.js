import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ msg: "Password too short" });
  }


  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ msg: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash: hash
  });

  const { passwordHash, ...safeUser } = user._doc;
  res.json({ token: createToken(user._id), user: safeUser });

});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) return res.status(400).json({ msg: "Account not found" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ msg: "Incorrect password" });

  const { passwordHash, ...safeUser } = user._doc;

  res.json({
    token: createToken(user._id),
    user: safeUser
  });
});


router.get("/me", protect, async (req, res) => {
  const user = req.user;
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    onboardingCompleted: user.onboardingCompleted
  });
});



router.put("/onboarding", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.profile) {
      user.profile = {
        permissions: { camera: false, mic: false }
      };
    }

    const allowedFields = [
      "fullName",
      "age",
      "gender",
      "height",
      "weight",
      "fitnessLevel",
      "goal",
      "injuries",
      "conditions"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user.profile[field] = req.body[field];
      }
    });

    if (req.body.permissions) {
      user.profile.permissions = {
        ...user.profile.permissions,
        ...req.body.permissions
      };
    }

    user.onboardingCompleted = true;
    await user.save();

    const { passwordHash, ...safeUser } = user._doc;
    res.json(safeUser);
  } catch (err) {
    console.error("🔥 ONBOARDING SAVE ERROR:", err);
    res.status(500).json({ msg: "Failed to save onboarding" });
  }
});



router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // ✅ ensure profile exists
    if (!user.profile) user.profile = {};

    // ✅ update only allowed fields
    const allowedFields = [
      "fullName",
      "age",
      "gender",
      "height",
      "weight",
      "fitnessLevel",
      "goal",
      "injuries",
      "conditions"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user.profile[field] = req.body[field];
      }
    });

    // 🚨 DO NOT TOUCH permissions unless explicitly sent
    if (req.body.permissions) {
      user.profile.permissions = {
        ...user.profile.permissions,
        ...req.body.permissions
      };
    }

    await user.save();

    const { passwordHash, ...safeUser } = user._doc;
    res.json(safeUser);
  } catch (err) {
    console.error("PROFILE UPDATE ERROR", err);
    res.status(500).json({ msg: "Profile update failed" });
  }
});





export default router;