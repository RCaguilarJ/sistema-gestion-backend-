import express from "express";
// CORRECCIÓN: ../controllers y ../middleware
import { getAllUsers } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles("ADMIN"), getAllUsers);

export default router;