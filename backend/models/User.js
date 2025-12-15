const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  username: String,
  email: { type: String, default: '' }, // For schedule notifications
  phone: { type: String, default: '' }, // For future SMS notifications
  hash: String,
  salt: String,
  memberSince: String,
  status: String,
  admin: { type: Boolean, default: false },
  blockedDates: [{ date: String, comment: String, approved: Boolean, approvedBy: String }],
  jobsCompleted: { type: Number, default: 0 },
  notificationPreferences: {
    dailyBriefing: { type: Boolean, default: true },
    scheduleChanges: { type: Boolean, default: true }
  }
});

// Cascade delete: Remove all related records when user is deleted
User.pre('findOneAndDelete', async function (next) {
  try {
    const userId = this.getQuery()._id;

    // Delete related records
    const Attendance = mongoose.model('Attendance');
    const Message = mongoose.model('Message');
    const Rating = mongoose.model('Rating');
    const Announcement = mongoose.model('Announcement');
    const ServiceHistory = mongoose.model('ServiceHistory');

    await Attendance.deleteMany({ userId });
    await Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    await Rating.deleteMany({ employeeId: userId });
    await Announcement.deleteMany({ authorId: userId });
    await ServiceHistory.deleteMany({ employeeId: userId });

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', User);
