import express from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/me", getProfile);
router.put("/me", updateProfile);
router.post("/change-password", changePassword);

export default router; 