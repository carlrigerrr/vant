const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Middleware to check authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// Get all conversations (grouped by user)
router.get('/conversations', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        })
            .populate('senderId', 'username')
            .populate('receiverId', 'username')
            .sort({ createdAt: -1 });

        // Group by conversation partner
        const conversationMap = {};

        messages.forEach(msg => {
            // Determine the other person in the conversation
            const isSender = msg.senderId._id.toString() === userId.toString();
            const otherUser = isSender ? msg.receiverId : msg.senderId;
            const otherUserId = otherUser._id.toString();

            if (!conversationMap[otherUserId]) {
                conversationMap[otherUserId] = {
                    partnerId: otherUser._id,
                    partnerName: otherUser.username,
                    lastMessage: msg.content,
                    lastMessageTime: msg.createdAt,
                    lastMessageIsFromMe: isSender,
                    unreadCount: 0,
                    subject: msg.subject
                };
            }

            // Count unread messages (only received ones)
            if (!isSender && !msg.read) {
                conversationMap[otherUserId].unreadCount++;
            }
        });

        // Convert to array and sort by last message time
        const conversations = Object.values(conversationMap)
            .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get full message thread with a specific user
router.get('/thread/:userId', isAuthenticated, async (req, res) => {
    try {
        const myId = req.user._id;
        const partnerId = req.params.userId;

        // Get all messages between these two users
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: partnerId },
                { senderId: partnerId, receiverId: myId }
            ]
        })
            .populate('senderId', 'username')
            .populate('receiverId', 'username')
            .sort({ createdAt: 1 }); // Oldest first for chat display

        // Mark unread messages as read
        await Message.updateMany(
            { senderId: partnerId, receiverId: myId, read: false },
            { read: true }
        );

        // Add isFromMe flag for easy UI rendering
        const enrichedMessages = messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            subject: msg.subject,
            createdAt: msg.createdAt,
            isFromMe: msg.senderId._id.toString() === myId.toString(),
            senderName: msg.senderId.username,
            read: msg.read
        }));

        res.json(enrichedMessages);
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get inbox (messages received)
router.get('/inbox', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message.find({ receiverId: req.user._id })
            .populate('senderId', 'username')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get sent messages
router.get('/sent', isAuthenticated, async (req, res) => {
    try {
        const messages = await Message.find({ senderId: req.user._id })
            .populate('receiverId', 'username')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get unread count
router.get('/unread-count', isAuthenticated, async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiverId: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Send a message
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { receiverId, subject, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ msg: 'Receiver and content are required' });
        }

        const message = new Message({
            senderId: req.user._id,
            receiverId,
            subject: subject || '',
            content
        });

        await message.save();
        res.json({ msg: 'Message sent', message });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Mark message as read
router.put('/:id/read', isAuthenticated, async (req, res) => {
    try {
        const message = await Message.findOneAndUpdate(
            { _id: req.params.id, receiverId: req.user._id },
            { read: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        res.json({ msg: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get all users for sending messages (for admin to message employees)
router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const users = await User.find()
            .select('username admin')
            .sort({ username: 1 });
        res.json(users.filter(u => u._id.toString() !== req.user._id.toString()));
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete a message (only receiver can delete from their inbox)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const message = await Message.findOneAndDelete({
            _id: req.params.id,
            $or: [{ receiverId: req.user._id }, { senderId: req.user._id }]
        });

        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        res.json({ msg: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
