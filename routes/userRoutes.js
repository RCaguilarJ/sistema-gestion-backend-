import express from "express";
import { getAllUsers } from "../controllers/userController.js";

const router = express.Router();

// Ruta: GET /api/users
router.get("/", getAllUsers);

export default router;
