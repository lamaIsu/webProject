// Controllers/tasksController.js
// يجب استيراد مودل المستخدمين لأنه الآن يحتوي على دالة المهام
const User = require('../Models/users');

// ----------------------------------------------------
// معالج إضافة مهمة جديدة (CREATE TASK)
// ----------------------------------------------------
async function handleCreateTask(req, res) {
    try {
        const { title, dueDate, userId } = req.body;

        if (!title || !userId) {
            return res.status(400).json({ message: 'Task title and userId are required.' });
        }

        // 3. استدعاء الدالة الجديدة من مودل المستخدمين (User)
        // يتم إرسال المهمة الجديدة ومعرّف المستخدم
        const { result, newTask } = await User.addTaskToUser({ title, dueDate }, userId);

        if (result.modifiedCount === 0) {
            // إذا لم يتم تعديل أي مستند، فغالباً الـ userId غير موجود
            return res.status(404).json({ message: 'User not found with the provided ID.' });
        }

        res.status(201).json({
            message: "Task added to user document successfully!",
            taskId: newTask._id, // إرجاع معرّف المهمة الجديدة (المضمنة)
            userId: userId
        });

    } catch (error) {
        console.error("Error in handleCreateTask:", error);
        res.status(500).json({ message: "Server error during task creation.", error: error.message });
    }
}

async function handleGetTasks(req, res) {
    const userId = req.query.userId || req.body.userId; 

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch tasks.' });
    }

    try {
        const tasks = await User.getTasksByUserId(userId);

        res.status(200).json({ 
            success: true, 
            tasks: tasks,
            total: tasks.length 
        });

    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Server error while fetching tasks.", error: error.message });
    }
}

async function handleUpdateTask(req, res) {
    const taskId = req.params.taskId; // المعرّف من مسار URL
    const { userId, completed } = req.body; // البيانات من جسم الطلب

    if (!userId || typeof completed === 'undefined' || !taskId) {
        return res.status(400).json({ message: 'Missing required fields (userId, taskId, completed status).' });
    }

    try {
        const result = await User.updateTaskStatus(userId, taskId, completed);

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User or task not found.' });
        }

        res.status(200).json({ 
            success: true, 
            message: "Task status updated successfully." 
        });

    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ message: "Server error during task status update.", error: error.message });
    }
}

module.exports = {
    handleCreateTask,
    handleGetTasks,
    handleUpdateTask
};