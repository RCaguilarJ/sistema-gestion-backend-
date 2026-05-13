import { Router } from "express";
import { login } from "../controllers/authController.js";
import { createUser } from "../controllers/userController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { ADMIN_ROLES } from "../constants/roles.js";

const router = Router();

router.post("/login", login);
router.post("/register", authenticate, authorizeRoles(...ADMIN_ROLES), createUser);

export default router;
