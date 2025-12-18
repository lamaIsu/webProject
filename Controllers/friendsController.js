const mongoose = require("mongoose");
const User = require("../Models/Users"); // تأكد من المسار الصحيح لموديل المستخدم

// تعريف موديل طلبات الصداقة داخل الكنترولر أو في ملف منفصل
const FriendRequest = mongoose.model("FriendRequest", new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}));

// 1. البحث عن مستخدمين (Search)
exports.handleSearchUsers = async (req, res) => {
    try {
        const searchTerm = req.query.username;
        if (!searchTerm) return res.json({ success: true, users: [] });
        
        const users = await User.find({
            name: { $regex: searchTerm, $options: "i" }
        }).limit(10).select("name email");
        
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. جلب قائمة الأصدقاء الحقيقيين
exports.handleGetFriends = async (req, res) => {
    try {
        const { userId } = req.query;
        // نجلب المستخدم ونقوم بعمل populate للأصدقاء
        const user = await User.findById(userId).populate("friends", "name email");
        res.json({ success: true, friends: user ? user.friends : [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. جلب طلبات الصداقة المعلقة (Pending)
exports.handleGetRequests = async (req, res) => {
    try {
        const { userId } = req.query;
        const requests = await FriendRequest.find({ receiver: userId, status: 'pending' })
                                            .populate("sender", "name email");
        res.json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. قبول طلب الصداقة
exports.handleAcceptRequest = async (req, res) => {
    const { requestId, userId, senderId } = req.body;
    try {
        // تحديث حالة الطلب
        await FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted' });
        
        // إضافة كل منهما لقائمة أصدقاء الآخر في موديل User
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: senderId } });
        await User.findByIdAndUpdate(senderId, { $addToSet: { friends: userId } });
        
        res.json({ success: true, message: "Friend added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. رفض طلب الصداقة
exports.handleRejectRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        await FriendRequest.findByIdAndDelete(requestId);
        res.json({ success: true, message: "Request rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. إرسال دعوة للجلسة
exports.handleInviteToSession = async (req, res) => {
    // هنا يمكنك إضافة منطق إرسال إشعار لحظي (Socket.io) مستقبلاً
    res.json({ success: true, message: "Invitation recorded" });
};