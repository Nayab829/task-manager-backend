import User from "../models/user.model.js";
import asyncHandler from "express-async-handler"
import bcrypt from "bcrypt"
import { generateToken } from "../utils/generateToken.js";
import { cookieOptions } from "../utils/cookieOptions.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Task from "../models/task.model.js"

export const Register = asyncHandler(async (req, res) => {
    const { name, email, password, adminInviteToken } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are mandatory." });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    let role = "member";
    if (adminInviteToken == process.env.ADMIN_INVITE_TOKEN) {
        role = "admin"
    }
    //  Handle avatar upload
    let avatarUrl = null;
    if (req.file) {
        const avatar = await uploadOnCloudinary(req.file.path);
        avatarUrl = avatar?.secure_url || null;
    }

    const user = await User.create({
        name,
        email,
        password: hashPassword,
        role,
        avatar: avatarUrl
    })
    const createdUser = await User.findById(user._id).select("-password")
    const token = generateToken(user._id)

    return res
        .status(201)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User registered successfully",
            data: createdUser,
            token
        })
})


export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are mandatory." })
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User doesn't exist." })
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid credentials." })
    }
    const loggedInUser = await User.findById(user._id).select("-password")

    const token = generateToken(user._id)
    return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            message: "User logged in successfully",
            data: loggedInUser,
            token
        })


})

export const logout = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .clearCookie("token", cookieOptions)
        .json({ success: true, message: "Logged out successfully" });
});


export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" })
    }
    return res.status(200).json({ success: true, data: user })
})


export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ role: "member" }).select("-password");
    const userWithTaskCount = await Promise.all(users.map(async (user) => {
        const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
        const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "In-Progress" });
        const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" })
        return {
            ...user.toObject(),
            pendingTasks,
            inProgressTasks,
            completedTasks
        }

    }))
    return res.status(200).json(userWithTaskCount)

})


export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) {
        return res.status(404).json("User not found.")
    }

    return res.status(200).json(user)

})