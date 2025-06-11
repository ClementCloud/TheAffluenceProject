import { calculateSavingsPlan } from "../services/savingsCalculator.js";

export const calculatePlan = (req, res) => {
  const { goals, disposableIncome, currentSavings } = req.body;
  if (!Array.isArray(goals) || typeof disposableIncome !== "number") {
    return res.status(400).json({ error: "Invalid input" });
  }
  const plan = calculateSavingsPlan(goals, disposableIncome, currentSavings);
  res.json(plan);
}; 