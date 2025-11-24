import express from "express";
import { getAllUsers, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas estas rutas requieren ser ADMIN
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllUsers);
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteUser);

export default router;