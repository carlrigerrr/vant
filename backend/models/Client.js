const mongoose = require('mongoose');
const crypto = require('crypto');

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    hash: String,
    salt: String,
    active: { type: Boolean, default: true },
    priority: {
        type: String,
        enum: ['regular', 'vip', 'new'],
        default: 'regular'
    },
    serviceStatus: {
        type: String,
        enum: ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    nextServiceDate: { type: Date },
    lastServiceDate: { type: Date },
    serviceNotes: { type: String },
    hideContacts: { type: Boolean, default: false },
    // Location tracking
    location: {
        coordinates: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null }
        },
        formattedAddress: { type: String, default: '' },
        lastUpdated: { type: Date },
        source: { type: String, enum: ['gps', 'manual', 'map'], default: 'manual' }
    },
    shareLocation: { type: Boolean, default: true },

    // ==================== CLIENT BIBLE ====================
    // Property access information
    propertyDetails: {
        entryInstructions: { type: String, default: '' },
        alarmCode: { type: String, default: '' },
        gateCode: { type: String, default: '' },
        keyLocation: { type: String, default: '' },
        lockboxCode: { type: String, default: '' },
        wifiPassword: { type: String, default: '' },
        parkingInstructions: { type: String, default: '' },
        // Pet and household info
        petInfo: { type: String, default: '' },
        // Cleaning preferences
        clientPreferences: { type: String, default: '' },
        areasToAvoid: { type: String, default: '' },
        // Internal notes (only visible to admin)
        internalNotes: { type: String, default: '' },
        // Photos (stored as URLs or base64)
        photos: [{
            url: { type: String },
            caption: { type: String },
            uploadedAt: { type: Date, default: Date.now }
        }],
        // Track when client bible was last updated
        lastUpdated: { type: Date },
        lastUpdatedBy: { type: String } // 'admin' or 'client'
    },

    createdAt: { type: Date, default: Date.now }
});


// Hash password before saving
clientSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(32).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
};

// Verify password
clientSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('hex');
    return this.hash === hash;
};

// Cascade delete: Remove all related records when client is deleted
clientSchema.pre('findOneAndDelete', async function (next) {
    try {
        const clientId = this.getQuery()._id;

        // Delete related records
        const Rating = mongoose.model('Rating');
        const RescheduleRequest = mongoose.model('RescheduleRequest');
        const ServiceHistory = mongoose.model('ServiceHistory');
        const Attendance = mongoose.model('Attendance');

        await Rating.deleteMany({ clientId });
        await RescheduleRequest.deleteMany({ clientId });
        await ServiceHistory.deleteMany({ clientId });
        await Attendance.deleteMany({ clientId });

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Client', clientSchema);
