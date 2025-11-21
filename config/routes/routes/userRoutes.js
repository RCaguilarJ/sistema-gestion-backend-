import express from "express";
import { getAllUsers } from "../../controllers/userController.js";
import { authenticate, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Ruta: GET /api/users (solo ADMIN puede acceder)
router.get("/", authenticate, authorizeRoles("ADMIN"), getAllUsers);

export default router;
