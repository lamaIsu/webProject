const mongoose = require("mongoose");
const User = require("../Models/Users");

const FriendRequest = mongoose.model("FriendRequest", new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}));

// Search for users
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

// get friesnds list
exports.handleGetFriends = async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId).populate("friends", "name email");
        res.json({ success: true, friends: user ? user.friends : [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// get Pending requests
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

// accept request 
exports.handleAcceptRequest = async (req, res) => {
    const { requestId, userId, senderId } = req.body;
    try {
        // update request state
        await FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted' });
        
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: senderId } });
        await User.findByIdAndUpdate(senderId, { $addToSet: { friends: userId } });
        
        res.json({ success: true, message: "Friend added successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// reject request  
exports.handleRejectRequest = async (req, res) => {
    const { requestId } = req.body;
    try {
        await FriendRequest.findByIdAndDelete(requestId);
        res.json({ success: true, message: "Request rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// invite to session
exports.handleInviteToSession = async (req, res) => {
    
    res.json({ success: true, message: "Invitation recorded" });
};
