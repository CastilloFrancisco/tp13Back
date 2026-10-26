import { Router } from "express";
import booksRoutes from "./books.routes.js";
import libraryRoutes from "./library.routes.js";

const router = Router();

router.use("/books", booksRoutes);
router.use("/library", libraryRoutes);

export default router;
