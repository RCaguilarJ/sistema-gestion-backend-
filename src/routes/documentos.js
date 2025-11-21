import express from "express";
import multer from "multer";
import { uploadDoc, getDocs, deleteDoc } from "../controllers/documentosController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/:pacienteId", getDocs);
router.post("/upload", upload.single("archivo"), uploadDoc);
router.delete("/:id", deleteDoc);

export default router;
