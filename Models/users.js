const { MongoClient, ObjectId } = require('mongodb');
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'users-db';
const COLLECTION_NAME = 'users';
let db;

async function connectToDb() {
  const user = new MongoClient(MONGO_URL);
  await user.connect();
  console.log('Model connected to MongoDB!');
  db = user.db(DB_NAME);
}
connectToDb(); 

//user signup (add user function)
async function addUser(userData) {
  const collection = db.collection(COLLECTION_NAME);
  return await collection.insertOne(userData);
}

//user login
async function findUserByEmailAndPass(email, pass) {
  const collection = db.collection(COLLECTION_NAME);
  return await collection.findOne({ email, pass });
}

//create new tasks
async function addTaskToUser(taskData, userId) {
    const collection = db.collection(COLLECTION_NAME);
    const newTask = {
        _id: new ObjectId(),
        title: taskData.title,
        dueDate: taskData.dueDate,
        completed: false,
        createdAt: new Date()
    };
    const result = await collection.updateOne(
        { _id: new ObjectId(userId) }, 
        { 
            $push: { 
                tasks: newTask 
            } 
        }
    );
    return { result, newTask };
}

//return tasks by user id
async function getTasksByUserId(userId) {
    const collection = db.collection(COLLECTION_NAME); 
 
    const user = await collection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { tasks: 1, _id: 0 } }
    );
    return user ? (user.tasks || []) : [];
}

async function updateTaskStatus(userId, taskId, isCompleted) {
    const collection = db.collection(COLLECTION_NAME); 

    // نبحث عن المستخدم باستخدام _id، والمهمة داخل المصفوفة باستخدام "tasks._id"
    const result = await collection.updateOne(
        { 
            _id: new ObjectId(userId), 
            "tasks._id": new ObjectId(taskId) 
        }, 
        { 
            // $set لتحديث الحقل، و $ لإشارة إلى العنصر المطابق في المصفوفة
            $set: { 
                "tasks.$.completed": isCompleted 
            } 
        }
    );

    return result;
}

// ******************************************************
// دوال الكورسات المضمنة
// ******************************************************

// دالة إضافة كورس جديد
async function addCourseToUser(courseData, userId) {
    const collection = db.collection(COLLECTION_NAME);
    const newCourse = {
        _id: new ObjectId(),
        name: courseData.name,
        numProjects: courseData.numProjects || 0,
        numExams: courseData.numExams || 0,
        progress: 0, // يبدأ التقدم من صفر
        createdAt: new Date()
    };
    
    const result = await collection.updateOne(
        { _id: new ObjectId(userId) }, 
        { 
            $push: { 
                courses: newCourse
            } 
        }
    );
    return { result, newCourse };
}

// دالة جلب جميع كورسات المستخدم
async function getCoursesByUserId(userId) {
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { courses: 1, _id: 0 } }
    );

    return user ? (user.courses || []) : [];
}

async function getCourseById(userId, courseId) {
    const collection = db.collection(COLLECTION_NAME); 

    const user = await collection.findOne(
        { _id: new ObjectId(userId) },
        { 
            projection: { 
                courses: { 
                    $elemMatch: { _id: new ObjectId(courseId) } // يطابق عنصر واحد فقط
                } 
            } 
        }
    );

    // نرجع العنصر الأول المطابق (وهو الكورس المطلوب)
    return user && user.courses ? user.courses[0] : null;
}

async function addCourseTask(taskData, userId) {
    // 💡 افتراض: COLLECTION_NAME هو اسم مجموعة المستخدمين
    const collection = db.collection(COLLECTION_NAME);
    
    // 1. تحديد نوع المصفوفة التي سيتم الإضافة إليها (Projects أو Exams)
    const arrayName = taskData.type === 'project' ? 'courses.$.projects' : 'courses.$.exams'; 

    // 2. إنشاء وثيقة المهمة الجديدة
    const newCourseTask = {
        _id: new ObjectId(), // ID فريد للمهمة
        title: taskData.title,
        dueDate: taskData.dueDate,
        completed: false, // يبدأ غير مُنجز
        createdAt: new Date()
    };
    
    // 3. بناء طلب التحديث (updateOne)
    const result = await collection.updateOne(
        // معيار البحث (الوثيقة الرئيسية): ابحث عن المستخدم الذي يحتوي على
        { 
            _id: new ObjectId(userId), 
            // 💡 معيار تحديد العنصر في المصفوفة: ابحث عن الكورس داخل المصفوفة 
            // الذي يتطابق مع courseId المرسل
            'courses._id': new ObjectId(taskData.courseId) 
        }, 
        { 
            // $push: لإضافة العنصر الجديد إلى المصفوفة المُحددة
            $push: { 
                // نستخدم $ لتمثيل العنصر المطابق (الكورس) داخل المصفوفة
                [arrayName]: newCourseTask 
            },
            // $inc: لزيادة عداد المشاريع أو الاختبارات
            $inc: {
                [`courses.$.num${taskData.type === 'project' ? 'Projects' : 'Exams'}`]: 1
            }
        }
    );

    // 4. إرجاع النتيجة
    return { result, newCourseTask };
}
// Models/users.js

async function updateCourseTaskStatus(userId, courseId, taskId, isCompleted) {
    const collection = db.collection(COLLECTION_NAME); 
    
    // 🛑 1. التحقق من صلاحية المعرفات (للتأكد من أنها strings قبل التحويل)
    if (!userId || !courseId || !taskId) {
        throw new Error("Missing required IDs for course task status update.");
    }
    
    try {
        // تحويل المعرفات إلى كائن ObjectId قبل الاستعلام
        const userObjId = new ObjectId(userId);
        const courseObjId = new ObjectId(courseId);
        const taskObjId = new ObjectId(taskId);

        let result = await collection.updateOne(
            { 
                _id: userObjId, 
                "courses._id": courseObjId, // شرط العثور على الكورس
                "courses.projects._id": taskObjId // شرط العثور على المهمة في مصفوفة المشاريع
            }, 
            { 
                // $ تحدد العنصر المطابق في الشرط الأخير (المشروع داخل الكورس)
                $set: { 
                    "courses.$.projects.$[taskElement].completed": isCompleted 
                } 
            },
            { 
                // فلتر واحد لتحديد المهمة الصحيحة داخل المشاريع
                arrayFilters: [
                    { "taskElement._id": taskObjId } 
                ]
            }
        );
        if (result.modifiedCount === 0) {
            result = await collection.updateOne(
                { 
                    _id: userObjId, 
                    "courses._id": courseObjId, // شرط العثور على الكورس
                    "courses.exams._id": taskObjId // شرط العثور على المهمة في مصفوفة الاختبارات
                }, 
                { 
                    $set: { 
                        "courses.$.exams.$[taskElement].completed": isCompleted 
                    } 
                },
                { 
                    // فلتر لتحديد المهمة الصحيحة داخل الاختبارات
                    arrayFilters: [
                        { "taskElement._id": taskObjId } 
                    ]
                }
            );
        }

        return result;

    } catch (error) {
        // 💡 التقاط أخطاء تحويل ObjectId أو أخطاء MongoDB
        console.error("Error in updateCourseTaskStatus:", error.message);
        // إعادة إلقاء الخطأ (Throw) لتتمكن الكنترولر من التقاطه ومعالجته كـ 500
        throw error; 
    }
}
// Models/users.js

// ... (الدوال الموجودة سابقًا)

// دالة لتحديث درجة مهمة معينة
async function updateCourseTaskGrade(userId, courseId, taskId, grade) {
    const collection = db.collection(COLLECTION_NAME); 

    if (!userId || !courseId || !taskId) {
        throw new Error("Missing required IDs for grade update.");
    }

    try {
        const userObjId = new ObjectId(userId);
        const courseObjId = new ObjectId(courseId);
        const taskObjId = new ObjectId(taskId);
        
        // ----------------------------------------------------
        // 1. محاولة التحديث إذا كانت المهمة مشروع (project)
        // ----------------------------------------------------
        let result = await collection.updateOne(
            { 
                _id: userObjId, 
                "courses._id": courseObjId, 
                "courses.projects._id": taskObjId 
            }, 
            { 
                // 💡 التحديث إلى حقل "grade"
                $set: { 
                    "courses.$.projects.$[taskElement].grade": grade 
                } 
            },
            { 
                arrayFilters: [
                    { "taskElement._id": taskObjId } 
                ]
            }
        );

        // ----------------------------------------------------
        // 2. إذا لم يتم تعديل أي شيء، فجرب الاختبارات (exams)
        // ----------------------------------------------------
        if (result.modifiedCount === 0) {
            result = await collection.updateOne(
                { 
                    _id: userObjId, 
                    "courses._id": courseObjId, 
                    "courses.exams._id": taskObjId 
                }, 
                { 
                    // 💡 التحديث إلى حقل "grade"
                    $set: { 
                        "courses.$.exams.$[taskElement].grade": grade 
                    } 
                },
                { 
                    arrayFilters: [
                        { "taskElement._id": taskObjId } 
                    ]
                }
            );
        }
        
        return result;

    } catch (error) {
        console.error("Critical Error in updateCourseTaskGrade (MongoDB):", error);
        throw error; 
    }
}


// Friends page
async function searchUsers(term, currentUserId) {
    const collection = db.collection(COLLECTION_NAME);
    return await collection.find({
        name: { $regex: term, $options: 'i' },
        _id: { $ne: new ObjectId(currentUserId) } // استبعاد المستخدم الحالي من البحث
    }, { projection: { name: 1, email: 1 } }).toArray();
}

async function sendFriendRequest(senderId, receiverId) {
    const collection = db.collection(COLLECTION_NAME);
    return await collection.updateOne(
        { _id: new ObjectId(receiverId) },
        { $addToSet: { pendingRequests: { _id: new ObjectId(senderId), createdAt: new Date() } } }
    );
}

async function acceptFriend(userId, friendId) {
    const collection = db.collection(COLLECTION_NAME);
    const userOid = new ObjectId(userId);
    const friendOid = new ObjectId(friendId);

    await collection.updateOne({ _id: userOid }, { $pull: { pendingRequests: { _id: friendOid } } });
    
    await collection.updateOne({ _id: userOid }, { $addToSet: { friends: friendOid } });
    await collection.updateOne({ _id: friendOid }, { $addToSet: { friends: userOid } });
}

async function getFriendsFullData(userId) {
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.friends) return [];
    
    return await collection.find({ _id: { $in: user.friends } }, { projection: { name: 1 } }).toArray();
}

async function getPendingRequests(userId) {
    const collection = db.collection(COLLECTION_NAME);
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user || !user.pendingRequests) return [];

    const senderIds = user.pendingRequests.map(r => r._id);
    return await collection.find({ _id: { $in: senderIds } }, { projection: { name: 1 } }).toArray();
}


module.exports = {
    addUser,
    findUserByEmailAndPass,
    db,
    ObjectId,
    addTaskToUser,
    getTasksByUserId,
    updateTaskStatus,
    getCoursesByUserId,
    addCourseToUser,
    getCourseById,
    addCourseTask,
    updateCourseTaskStatus,
    updateCourseTaskGrade,
    searchUsers,
    sendFriendRequest,
    acceptFriend,
    getFriendsFullData,
    getPendingRequests,

};
