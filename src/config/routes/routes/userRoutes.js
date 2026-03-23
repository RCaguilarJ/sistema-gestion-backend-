import express from "express";
import { getAllUsers, getEspecialistas, createUser, updateUser, deleteUser } from "../../../controllers/userController.js";
import { authenticate, authorizeRoles } from "../../../middleware/authMiddleware.js";
import { ADMIN_ROLES, ADMIN_VIEW_ROLES } from "../../../constants/roles.js";

const router = express.Router();

// Ruta: GET /api/users/especialistas (especialistas y admins)
router.get("/especialistas", authenticate, getEspecialistas);

// Ruta: GET /api/users (ADMIN/SUPER_ADMIN/RECEPCION solo lectura)
router.get("/", authenticate, authorizeRoles(...ADMIN_VIEW_ROLES), getAllUsers);
router.post("/", authenticate, authorizeRoles(...ADMIN_ROLES), createUser);
router.put("/:id", authenticate, authorizeRoles(...ADMIN_ROLES), updateUser);
router.delete("/:id", authenticate, authorizeRoles(...ADMIN_ROLES), deleteUser);

export default router;
