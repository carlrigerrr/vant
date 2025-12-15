const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Attendance = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    shiftId: { type: String, default: null }, // String to support format like '1-1765516621126'
    checkIn: {
        time: Date,
        location: {
            lat: Number,
            lng: Number,
        },
        beforePhoto: String, // Legacy single photo (keep for backward compatibility)
        photos: [String], // Multiple photos array
    },
    checkOut: {
        time: Date,
        location: {
            lat: Number,
            lng: Number,
        },
        completionPhoto: String, // Legacy single photo
        photos: [String], // Multiple photos array
    },
    jobCompleted: {
        confirmed: { type: Boolean, default: false },
        time: Date,
    },
    safetyConfirmed: {
        confirmed: { type: Boolean, default: false },
        time: Date,
    },
    // Mileage tracking
    mileage: {
        distanceKm: { type: Number, default: null },
        distanceMiles: { type: Number, default: null },
        fromLocation: {
            lat: { type: Number },
            lng: { type: Number }
        },
        toLocation: {
            lat: { type: Number },
            lng: { type: Number }
        },
        calculatedAt: Date
    },
    // En-Route tracking for ETA
    enRoute: {
        active: { type: Boolean, default: false },
        startedAt: Date,
        fromLocation: {
            lat: { type: Number },
            lng: { type: Number }
        },
        toClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
        estimatedArrivalTime: Date,
        estimatedMinutes: { type: Number }
    },
    status: { type: String, enum: ['checked-in', 'checked-out', 'en-route'], default: 'checked-in' },
    gpsWarning: { type: String, default: null },
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', Attendance);
