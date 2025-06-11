import bcrypt from "bcryptjs";
import db, { initializeDB } from "../db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

initializeDB().catch(console.error);

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.data.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password, ...publicData } = user;
    res.json(publicData);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = db.data.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, age, email } = req.body;
    if (name !== undefined) user.name = name;
    if (age !== undefined) user.age = age;
    if (email !== undefined && email !== user.email) {
      // Ensure email uniqueness
      const exists = db.data.users.find(u => u.email === email && u.id !== userId);
      if (exists) return res.status(400).json({ error: "Email already taken" });
      user.email = email;
    }

    await db.write();
    const { password, ...publicData } = user;
    res.json(publicData);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });

    const user = db.data.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await db.write();

    // Optionally issue a new token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Password updated", token });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
}; 