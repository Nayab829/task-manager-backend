import { Router } from "express";
import { createTask, deleteTask, getDashboardData, getTaskById, getTasks, getUserDashboardData, updateTask, updateTodoChecklist } from "../controllers/task.controller.js";
import authUser, { adminOnly } from "../middlewares/auth.middleware.js";

const router = Router()

router.post("/", authUser, adminOnly, createTask)
router.get("/", authUser, getTasks)
router.get("/dashboard-data", authUser,adminOnly, getDashboardData)
router.get("/user-dashboard-data", authUser, getUserDashboardData)
router.get("/:id", authUser, getTaskById)
router.delete("/:id", authUser, adminOnly, deleteTask)
router.put("/:id", authUser, updateTask)
router.put("/:id/todo", authUser, updateTodoChecklist)


export default router
