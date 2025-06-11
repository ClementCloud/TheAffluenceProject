import express from "express";
import { calculatePlan } from "../controllers/planController.js";

const router = express.Router();

router.post("/calculate", calculatePlan);

export default router; 