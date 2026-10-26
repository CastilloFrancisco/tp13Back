import { Router } from "express";
import { addBookToLibrary, getLibraryBook, listUserLibrary, removeLibraryBook } from "../controllers/library.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.post("/", addBookToLibrary);
router.get("/", listUserLibrary);
router.get("/:bookId", getLibraryBook);
router.delete("/:bookId", removeLibraryBook);

export default router;
