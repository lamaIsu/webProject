// Controllers/coursesController.js (ملف جديد)

const User = require('../Models/users'); 
const { addCourseTask } = require('../Models/users');
// معالج إضافة كورس (POST)
async function handleCreateCourse(req, res) {
    const { name, numProjects, numExams, userId } = req.body;

    if (!name || !userId) {
        return res.status(400).json({ message: 'Course name and User ID are required.' });
    }

    try {
        const courseData = { name, numProjects: parseInt(numProjects), numExams: parseInt(numExams) };
        const result = await User.addCourseToUser(courseData, userId);
        
        res.status(201).json({ 
            success: true, 
            message: "Course added successfully!",
            course: result.newCourse // نرسل الكورس المضاف
        });

    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json({ message: "Server error during course creation.", error: error.message });
    }
}

// معالج جلب الكورسات (GET)
async function handleGetCourses(req, res) {
    const userId = req.query.userId; 

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch courses.' });
    }

    try {
        const courses = await User.getCoursesByUserId(userId);

        res.status(200).json({ 
            success: true, 
            courses: courses 
        });

    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Server error while fetching courses.", error: error.message });
    }
}



async function handleGetCourseDetails(req, res) {
    const courseId = req.params.courseId; // من المسار /api/courses/:courseId
    const userId = req.query.userId; // من استعلام URL

    if (!userId || !courseId) {
        return res.status(400).json({ message: 'User ID and Course ID are required.' });
    }

    try {
        const course = await User.getCourseById(userId, courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found for this user.' });
        }
        
        res.status(200).json({ 
            success: true, 
            course: course 
        });

    } catch (error) {
        console.error("Error fetching course details:", error);
        res.status(500).json({ message: "Server error while fetching course details.", error: error.message });
    }
}

// controllers/coursesController.js

async function handleAddCourseTask (req, res) {
    // 1. جلب البيانات من جسم الطلب (Body)
    const { courseId, userId, title, dueDate, type } = req.body;

    // 2. التحقق من البيانات المطلوبة
    if (!courseId || !userId || !title || !type) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields: courseId, userId, title, or type.' 
        });
    }

    // 3. التحقق من نوع المهمة (للتأكد من أنها 'project' أو 'exam')
    if (type !== 'project' && type !== 'exam') {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid task type. Must be "project" or "exam".' 
        });
    }

    try {
        // 4. استدعاء دالة الموديل لإضافة المهمة
        const taskData = { courseId, title, dueDate, type };
        
        // 💡 استخدام الدالة التي كتبتها: addCourseTask
        const { result, newCourseTask } = await addCourseTask(taskData, userId);

        // 5. التحقق من نتيجة التحديث (في حالة عدم العثور على المستخدم/الكورس)
        if (result.modifiedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Failed to add task. User or Course not found.'
            });
        }

        // 6. إرسال استجابة النجاح
        return res.status(201).json({ 
            success: true, 
            message: `${type} added successfully!`,
            task: newCourseTask 
        });

    } catch (error) {
        console.error("Error in handleAddCourseTask:", error);
        // التعامل مع أخطاء الخادم أو قاعدة البيانات
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during task creation.' 
        });
    }
}

async function handleUpdateCourseTaskStatus(req, res) {
    const taskId = req.params.taskId; // من المسار
    const { userId, completed, courseId } = req.body; 

    // 1. التحقق من البيانات
    if (!userId || !courseId || taskId === undefined || completed === undefined) {
        return res.status(400).json({ message: 'Missing User ID, Course ID, Task ID, or completion status.' });
    }

    try {
        // 2. استدعاء دالة الموديل الجديدة
        const result = await User.updateCourseTaskStatus(
            userId, 
            courseId, 
            taskId, 
            completed 
        );

        if (result.modifiedCount === 0) {
            // قد يعني أن المهمة لم توجد، أو لم يكن هناك تغيير في الحالة
            return res.status(404).json({ message: 'Course or Task not found, or status already set.' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Task status updated successfully.',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Error updating course task status:", error);
        res.status(500).json({ message: "Server error while updating task status.", error: error.message });
    }
}
// Controllers/coursesController.js

// ... (الدوال الأخرى)

async function handleUpdateCourseTaskGrade(req, res) {
    const taskId = req.params.taskId;
    const { userId, courseId, grade } = req.body; // نستقبل grade كقيمة رقمية

    // 1. التحقق من البيانات
    if (!userId || !courseId || !taskId || grade === undefined || isNaN(grade)) {
        return res.status(400).json({ message: 'Missing User ID, Course ID, Task ID, or valid grade.' });
    }
    
    // التأكد من أن الدرجة محصورة بين 0 و 100
    const finalGrade = Math.max(0, Math.min(100, parseFloat(grade)));

    try {
        // 2. استدعاء دالة الموديل
        const result = await User.updateCourseTaskGrade(
            userId, 
            courseId, 
            taskId, 
            finalGrade 
        );

        if (result.modifiedCount === 0) {
            // المهمة لم توجد، أو لم يكن هناك تغيير (إذا كانت الدرجة المرسلة هي نفسها المخزنة)
            return res.status(404).json({ message: 'Task not found or grade already set.' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Grade updated successfully.',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("Error updating course task grade:", error.message);
        res.status(500).json({ message: "Server error while updating task grade.", error: error.message });
    }
}

module.exports = {
    handleCreateCourse,
    handleGetCourses,
    handleGetCourseDetails,
    handleAddCourseTask,
    handleUpdateCourseTaskStatus,
    handleUpdateCourseTaskGrade
};