import express from "express";
import { getGoals, addGoal, updateGoal, deleteGoal } from "../controllers/goalsController.js";
import { authenticate } from "../middleware/authMiddleware.js"; // Assuming you have an auth middleware

const router = express.Router();

router.use(authenticate); // Protect all routes with authentication

router.get("/", getGoals);
router.post("/", addGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router; 