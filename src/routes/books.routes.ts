import { Router } from "express";
import { getBookByGoogleId, searchBooks } from "../controllers/books.controller.js";

const router = Router();

router.get("/search", searchBooks);
router.get("/:openLibraryId", getBookByGoogleId);

export default router;
