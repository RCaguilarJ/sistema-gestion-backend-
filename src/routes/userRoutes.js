import express from "express";
import { getAllUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Todas estas rutas requieren ser ADMIN
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllUsers);
router.post("/", authenticate, authorizeRoles("ADMIN"), createUser); // Nueva ruta para crear usuarios
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteUser);

export default router;