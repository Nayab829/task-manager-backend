import Task from "../models/task.model.js";
import { checkAssigned } from "../utils/checkAssigned.js";
import asyncHandler from "express-async-handler";

// Create Task
export const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status, priority, dueDate, todoCheckList } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({ message: "Title is required and must be at least 3 characters long." });
    }

    if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
        return res.status(400).json({ message: "AssignedTo must be a non-empty array of user IDs." });
    }

    const allowedStatus = ["Pending", "In-Progress", "Completed"];
    if (status && !allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
    }

    const allowedPriorities = ["Low", "Medium", "High"];
    if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({ message: "Invalid priority value." });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: "Due date must be a valid date." });
    }

    if (todoCheckList && !Array.isArray(todoCheckList)) {
        return res.status(400).json({ message: "todoCheckList must be an array." });
    }

    const task = await Task.create({
        title,
        description,
        assignedTo,
        status,
        priority,
        dueDate,
        todoCheckList,
        createdBy: req.user._id
    });

    res.status(201).json({ message: "Task created successfully", task });
});

// Get All Tasks
export const getTasks = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let tasks;
    if (req.user.role === "admin") {
        tasks = await Task.find(filter).populate("assignedTo", "name email avatar");
    } else {
        tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate("assignedTo", "name email avatar");
    }
    // Calculate progress before sending response
    const tasksWithProgress = tasks.map(task => {
        const completed = task.todoCheckList.filter(t => t.completed).length;
        const total = task.todoCheckList.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { ...task.toObject(), progress };
    });
    const allTasks = await Task.countDocuments(
        req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    )
    const pendingTasks = await Task.countDocuments({
        status: "Pending",
        ...(req.user.role !== "admin" && { assignedTo: req.user._id })
    })
    const inProgressTasks = await Task.countDocuments({
        status: "In-Progress",
        ...(req.user.role !== "admin" && { assignedTo: req.user._id })
    })
    const completedTasks = await Task.countDocuments({
        status: "Completed",
        ...(req.user.role !== "admin" && { assignedTo: req.user._id })
    })
    res.status(200).json({
        tasks: tasksWithProgress,
        statusSummary: {
            all: allTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks

        }
    });
});

// Get Single Task
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("assignedTo","name email avatar");
    if (!task) {
        return res.status(404).json({ message: "No Task Found." });
    }
    res.status(200).json(task);
});

// Delete Task
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
        return res.status(404).json({ message: "No Task Found." });
    }
    return res.status(200).json({ message: "Task deleted successfully" });
});

// Update Task
export const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("assignedTo", "name email avatar");
    if (!task) {
        return res.status(404).json({ message: "Task not found." });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.status = req.body.status || task.status;
    task.todoCheckList = req.body.todoCheckList || task.todoCheckList;
    task.dueDate = req.body.dueDate || task.dueDate;

    if (req.body.assignedTo) {
        if (!Array.isArray(req.body.assignedTo)) {
            return res.status(400).json({ message: "AssignedTo must be array of user IDs" });
        }
        task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();
    res.status(200).json({ message: "Task updated successfully", updatedTask });
});

// Update Task Status
export const updateTaskStatus = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("assignedTo", "name email avatar");
    if (!task) {
        return res.status(404).json({ message: "Task not found." });
    }

    // if (!checkAssigned(task, req.user)) {
    //     return res.status(400).json({ message: "Not authorized" });
    // }

    task.status = req.body.status || task.status;

    await task.save();
    res.status(200).json({ message: "Task status updated successfully", task });
});

// Update Todo Checklist
export const updateTodoChecklist = asyncHandler(async (req, res) => {
    const { todoCheckList } = req.body;
    const task = await Task.findById(req.params.id).populate("assignedTo", "name email avatar");

    if (!task) {
        return res.status(404).json({ message: "Task not found." });
    }

    // if (!checkAssigned(task, req.user)) {
    //     return res.status(400).json({ message: "Not authorized" });
    // }

    task.todoCheckList = todoCheckList;
    // ✅ calculate completed todos
    const completedCount = todoCheckList.filter(item => item.completed).length;

    // ✅ calculate status
    if (completedCount === 0) {
        task.status = "Pending";
    } else if (completedCount === todoCheckList.length) {
        task.status = "Completed";
    } else {
        task.status = "In-Progress";
    }

    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate("assignedTo", "name email avatar");
    res.status(200).json({ message: "Todo CheckList updated", task: updatedTask });
});


export const getDashboardData = asyncHandler(async (req, res) => {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ status: "In-Progress" })

    const taskPriorities = await Task.aggregate([
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 }
            }
        }
    ])
    const priorities = taskPriorities.reduce((acc, curr) => {
        acc[curr._id] = curr.count || 0;
        return acc;
    }, {})
    const recentTasks = await Task.find().sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({
        statistics: {
            all: totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks
        },
        priorities,

        recentTasks

    })
})


export const getUserDashboardData = asyncHandler(async (req, res) => {
    const totalTasks = await Task.countDocuments({ assignedTo: req.user._id });
    const completedTasks = await Task.countDocuments({ assignedTo: req.user._id, status: "Completed" });
    const pendingTasks = await Task.countDocuments({ assignedTo: req.user._id, status: "Pending" });
    const inProgressTasks = await Task.countDocuments({ assignedTo: req.user._id, status: "In-Progress" })

    const taskPriorities = await Task.aggregate([
        {
            $match: {
                assignedTo: req.user._id
            }
        },
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 }
            }
        }
    ])
    const priorities = taskPriorities.reduce((acc, curr) => {
        acc[curr._id] = curr.count || 0;
        return acc;
    }, {})
    const recentTasks = await Task.find({assignedTo:req.user._id}).sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({
        statistics: {
            all: totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks
        },
        priorities,

        recentTasks

    })
})