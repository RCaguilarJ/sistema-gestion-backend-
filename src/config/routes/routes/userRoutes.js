import express from "express";
import { getAllUsers, getEspecialistas, createUser, updateUser, deleteUser } from "../../../controllers/userController.js";
import { authenticate, authorizeRoles } from "../../../middleware/authMiddleware.js";

const router = express.Router();

// Ruta: GET /api/users/especialistas (especialistas y admins)
router.get("/especialistas", authenticate, getEspecialistas);

// Ruta: GET /api/users (solo ADMIN puede acceder)
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllUsers);
router.post("/", authenticate, authorizeRoles("ADMIN"), createUser);
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateUser);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteUser);

export default router;
