import mongoose from "mongoose";
const todoCheckListSchema = new mongoose.Schema({
    text: String,
    completed: {
        type: Boolean,
        default: false
    }
})
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },
    status: {
        type: String,
        enum: ["Pending", "In-Progress", "Completed"],
        default: "Pending"
    },
    dueDate: {
        type: Date,
        required: true
    },
    todoCheckList: [todoCheckListSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

}, { timestamps: true })

const Task = mongoose.model("Task", taskSchema);

export default Task;