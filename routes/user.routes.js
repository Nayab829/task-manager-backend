import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import { getAllUsers, getProfile, getUserById, login, logout, Register } from "../controllers/user.controller.js";
import authUser, { adminOnly } from "../middlewares/auth.middleware.js";

const router = Router()

router.post("/register", upload.single("avatar"), Register)
router.post("/login", login)

router.post("/logout", logout)
router.get("/profile", authUser, getProfile)
router.get("/", authUser,adminOnly,getAllUsers)
router.get("/:id", authUser,adminOnly,getUserById)

export default router