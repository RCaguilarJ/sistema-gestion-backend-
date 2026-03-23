import express from "express";
import { getAllUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { ADMIN_ROLES, ADMIN_VIEW_ROLES } from "../constants/roles.js";

const router = express.Router();

// Lectura para backoffice; cambios solo para administracion
router.get("/", authenticate, authorizeRoles(...ADMIN_VIEW_ROLES), getAllUsers);
router.post("/", authenticate, authorizeRoles(...ADMIN_ROLES), createUser);
router.put("/:id", authenticate, authorizeRoles(...ADMIN_ROLES), updateUser);
router.delete("/:id", authenticate, authorizeRoles(...ADMIN_ROLES), deleteUser);

export default router;
