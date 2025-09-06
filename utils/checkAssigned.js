export const checkAssigned = (task,user)=>{
    const isAssigned = task.assignedTo.some((userId) => userId.toString() === user._id.toString());
    if (!isAssigned && user.role !== "admin") {
        return false
    }
    return true
} 