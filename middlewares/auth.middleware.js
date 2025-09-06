import asyncHandler from "express-async-handler"
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"
const authUser = asyncHandler(async (req, res, next) => {
    try {
        let token;

        // 1) Check cookie
        if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // 2) Check Authorization header (Bearer token)
        else if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            return res.status(401).json({ message: "Not Authorized.Token not found." })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?._id).select("-password");
        if (!user) {
            return res.status(400).json({ message: "Invalid access token" })
        }
        req.user = user;
        next()

    } catch (error) {
        return res.status(500).json({ message: "Server error" })

    }
})

export const adminOnly = asyncHandler(async (req, res, next) => {
    try {
        if (req.user && req.user.role === "admin") {
            next()
        } else {
            return res.status(403).json({ message: "Access denied. Admin only." })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" })

    }
})

export default authUser;