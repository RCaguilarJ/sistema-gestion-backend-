import express from "express";
import { getNutricion } from "../controllers/nutricionController.js";
const router = express.Router();

router.get("/:pacienteId", getNutricion);

export default router;
