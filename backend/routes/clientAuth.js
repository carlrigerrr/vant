const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Client login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    Client.findOne({ email: email.toLowerCase() })
        .then((client) => {
            if (!client) {
                return res.status(401).json({ msg: 'Invalid email or password' });
            }

            if (!client.active) {
                return res.status(401).json({ msg: 'Account is inactive' });
            }

            if (!client.validPassword(password)) {
                return res.status(401).json({ msg: 'Invalid email or password' });
            }

            // Store client session
            req.session.clientId = client._id;
            req.session.isClient = true;

            res.json({
                msg: 'Login successful',
                client: {
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    address: client.address
                }
            });
        })
        .catch((err) => {
            console.error('Client login error:', err);
            res.status(500).json({ msg: 'Server error' });
        });
});

// Client logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ msg: 'Logout failed' });
        }
        res.json({ msg: 'Logged out successfully' });
    });
});

// Get current client session
router.get('/me', (req, res) => {
    if (!req.session.clientId) {
        return res.json({ isAuthenticated: false });
    }

    Client.findById(req.session.clientId)
        .then((client) => {
            if (!client) {
                return res.json({ isAuthenticated: false });
            }

            res.json({
                isAuthenticated: true,
                client: {
                    _id: client._id,
                    name: client.name,
                    email: client.email,
                    phone: client.phone,
                    address: client.address,
                    serviceStatus: client.serviceStatus,
                    nextServiceDate: client.nextServiceDate,
                    lastServiceDate: client.lastServiceDate,
                    serviceNotes: client.serviceNotes,
                    location: client.location,
                    shareLocation: client.shareLocation,
                    // Client Bible - property details (without internalNotes - admin only)
                    propertyDetails: client.propertyDetails ? {
                        entryInstructions: client.propertyDetails.entryInstructions,
                        alarmCode: client.propertyDetails.alarmCode,
                        gateCode: client.propertyDetails.gateCode,
                        keyLocation: client.propertyDetails.keyLocation,
                        lockboxCode: client.propertyDetails.lockboxCode,
                        wifiPassword: client.propertyDetails.wifiPassword,
                        parkingInstructions: client.propertyDetails.parkingInstructions,
                        petInfo: client.propertyDetails.petInfo,
                        clientPreferences: client.propertyDetails.clientPreferences,
                        areasToAvoid: client.propertyDetails.areasToAvoid,
                        photos: client.propertyDetails.photos,
                        lastUpdated: client.propertyDetails.lastUpdated
                    } : {}
                }
            });
        })
        .catch(() => {
            res.json({ isAuthenticated: false });
        });
});

// Update client location
router.put('/location', async (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const { lat, lng, formattedAddress, source, shareLocation } = req.body;

        const updateData = {
            'location.lastUpdated': new Date()
        };

        if (lat !== undefined && lng !== undefined) {
            updateData['location.coordinates.lat'] = lat;
            updateData['location.coordinates.lng'] = lng;
        }

        if (formattedAddress !== undefined) {
            updateData['location.formattedAddress'] = formattedAddress;
            // Also update the main address field so it syncs with "Your Information" section
            updateData.address = formattedAddress;
        }

        if (source !== undefined) {
            updateData['location.source'] = source;
        }

        if (shareLocation !== undefined) {
            updateData.shareLocation = shareLocation;
        }

        const client = await Client.findByIdAndUpdate(
            req.session.clientId,
            { $set: updateData },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json({
            msg: 'Location updated successfully',
            location: client.location,
            shareLocation: client.shareLocation,
            address: client.address
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ==================== CLIENT SELF-SERVICE PROPERTY DETAILS ====================

// Update own property details (client logged in)
router.put('/property-details', async (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const {
            entryInstructions,
            alarmCode,
            gateCode,
            keyLocation,
            lockboxCode,
            wifiPassword,
            parkingInstructions,
            petInfo,
            clientPreferences,
            areasToAvoid
        } = req.body;

        const updateData = {
            'propertyDetails.lastUpdated': new Date(),
            'propertyDetails.lastUpdatedBy': 'client'
        };

        // Only update fields that are provided (clients cannot update internalNotes)
        if (entryInstructions !== undefined) updateData['propertyDetails.entryInstructions'] = entryInstructions;
        if (alarmCode !== undefined) updateData['propertyDetails.alarmCode'] = alarmCode;
        if (gateCode !== undefined) updateData['propertyDetails.gateCode'] = gateCode;
        if (keyLocation !== undefined) updateData['propertyDetails.keyLocation'] = keyLocation;
        if (lockboxCode !== undefined) updateData['propertyDetails.lockboxCode'] = lockboxCode;
        if (wifiPassword !== undefined) updateData['propertyDetails.wifiPassword'] = wifiPassword;
        if (parkingInstructions !== undefined) updateData['propertyDetails.parkingInstructions'] = parkingInstructions;
        if (petInfo !== undefined) updateData['propertyDetails.petInfo'] = petInfo;
        if (clientPreferences !== undefined) updateData['propertyDetails.clientPreferences'] = clientPreferences;
        if (areasToAvoid !== undefined) updateData['propertyDetails.areasToAvoid'] = areasToAvoid;

        const client = await Client.findByIdAndUpdate(
            req.session.clientId,
            { $set: updateData },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json({
            msg: 'Property details updated successfully',
            propertyDetails: {
                entryInstructions: client.propertyDetails.entryInstructions,
                alarmCode: client.propertyDetails.alarmCode,
                gateCode: client.propertyDetails.gateCode,
                keyLocation: client.propertyDetails.keyLocation,
                lockboxCode: client.propertyDetails.lockboxCode,
                wifiPassword: client.propertyDetails.wifiPassword,
                parkingInstructions: client.propertyDetails.parkingInstructions,
                petInfo: client.propertyDetails.petInfo,
                clientPreferences: client.propertyDetails.clientPreferences,
                areasToAvoid: client.propertyDetails.areasToAvoid,
                lastUpdated: client.propertyDetails.lastUpdated
            }
        });
    } catch (error) {
        console.error('Error updating property details:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Photo upload configuration for clients
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'property-photos');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const photoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'client-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const photoUpload = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Upload property photo (client self-service)
router.post('/property-photos', photoUpload.single('photo'), async (req, res) => {
    if (!req.session.clientId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No photo uploaded' });
        }

        const photoData = {
            url: `/uploads/property-photos/${req.file.filename}`,
            caption: req.body.caption || '',
            uploadedAt: new Date()
        };

        const client = await Client.findByIdAndUpdate(
            req.session.clientId,
            {
                $push: { 'propertyDetails.photos': photoData },
                $set: {
                    'propertyDetails.lastUpdated': new Date(),
                    'propertyDetails.lastUpdatedBy': 'client'
                }
            },
            { new: true }
        ).select('propertyDetails.photos');

        if (!client) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json({
            msg: 'Photo uploaded successfully',
            photo: photoData,
            photos: client.propertyDetails.photos
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete property photo (client self-service)
router.delete('/property-photos/:photoIndex', async (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const client = await Client.findById(req.session.clientId).select('propertyDetails.photos');
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        const photoIndex = parseInt(req.params.photoIndex);
        const photos = client.propertyDetails?.photos || [];

        if (photoIndex < 0 || photoIndex >= photos.length) {
            return res.status(400).json({ msg: 'Invalid photo index' });
        }

        const photoToDelete = photos[photoIndex];

        // Delete file from disk
        if (photoToDelete.url) {
            const filePath = path.join(__dirname, '..', photoToDelete.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Remove from database
        photos.splice(photoIndex, 1);
        await Client.findByIdAndUpdate(req.session.clientId, {
            $set: {
                'propertyDetails.photos': photos,
                'propertyDetails.lastUpdated': new Date(),
                'propertyDetails.lastUpdatedBy': 'client'
            }
        });

        res.json({ msg: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get client's assigned shifts from schedules
router.get('/my-shifts', (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    const Shift = require('../models/Shift');

    // Find all shifts where this client is assigned
    Shift.find({})
        .then((schedules) => {
            const clientShifts = [];

            schedules.forEach((schedule) => {
                if (schedule.shifts && Array.isArray(schedule.shifts)) {
                    schedule.shifts.forEach((shift) => {
                        // Check if this shift is assigned to the current client
                        if (shift.clientId && shift.clientId.toString() === req.session.clientId.toString()) {
                            clientShifts.push({
                                date: schedule.date,
                                scheduleName: schedule.name,
                                employeeName: shift.employeeName,
                                employeeId: shift.employeeId,
                                shiftType: shift.shiftType,
                                startTime: shift.startTime,
                                endTime: shift.endTime,
                                notes: shift.notes,
                                status: shift.status
                            });
                        }
                    });
                }
            });

            // Sort by date (newest first)
            clientShifts.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.json({ shifts: clientShifts });
        })
        .catch((err) => {
            console.error('Error fetching client shifts:', err);
            res.status(500).json({ msg: 'Server error' });
        });
});

// Get client's shifts with LIVE status (employee check-in, ETA)
router.get('/my-shifts-live', async (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const Shift = require('../models/Shift');
        const Attendance = require('../models/Attendance');
        const User = require('../models/User');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Find all shifts for this client
        const schedules = await Shift.find({});
        const clientShifts = [];

        schedules.forEach((schedule) => {
            if (schedule.shifts && Array.isArray(schedule.shifts)) {
                schedule.shifts.forEach((shift) => {
                    if (shift.clientId && shift.clientId.toString() === req.session.clientId.toString()) {
                        const shiftDate = new Date(schedule.date);
                        // Only include today and upcoming shifts (up to next week)
                        if (shiftDate >= today && shiftDate <= nextWeek) {
                            clientShifts.push({
                                shiftId: shift._id || shift.id,
                                date: schedule.date,
                                scheduleName: schedule.name,
                                employeeName: shift.employeeName,
                                employeeId: shift.employeeId,
                                shiftType: shift.shiftType,
                                startTime: shift.startTime,
                                endTime: shift.endTime,
                                notes: shift.notes,
                                status: shift.status
                            });
                        }
                    }
                });
            }
        });

        // Get today's attendance records for these employees
        const attendanceRecords = await Attendance.find({
            clientId: req.session.clientId,
            createdAt: { $gte: today, $lt: tomorrow }
        });

        // Enrich shifts with live status
        const enrichedShifts = await Promise.all(clientShifts.map(async (shift) => {
            const shiftDate = new Date(shift.date);
            const isToday = shiftDate.toDateString() === today.toDateString();

            // Check if employee has checked in for this shift today
            const attendance = attendanceRecords.find(a =>
                a.employeeId?.toString() === shift.employeeId?.toString()
            );

            let liveStatus = 'scheduled';
            let checkInTime = null;
            let checkOutTime = null;
            let employeeOnSite = false;
            let jobCompleted = false;

            if (attendance) {
                checkInTime = attendance.checkIn?.time;
                checkOutTime = attendance.checkOut?.time;
                jobCompleted = attendance.jobCompleted?.confirmed || false;

                if (checkOutTime) {
                    liveStatus = jobCompleted ? 'completed' : 'checked_out';
                } else if (checkInTime) {
                    liveStatus = 'on_site';
                    employeeOnSite = true;
                }
            }

            // Get employee phone for contact (if available)
            let employeePhone = null;
            if (shift.employeeId) {
                const employee = await User.findById(shift.employeeId).select('phone');
                employeePhone = employee?.phone;
            }

            return {
                ...shift,
                isToday,
                liveStatus,
                checkInTime: checkInTime ? new Date(checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
                checkOutTime: checkOutTime ? new Date(checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
                employeeOnSite,
                jobCompleted,
                employeePhone
            };
        }));

        // Sort by date
        enrichedShifts.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({ shifts: enrichedShifts });
    } catch (err) {
        console.error('Error fetching live shifts:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get client's service history (past completed services)
router.get('/service-history', async (req, res) => {
    if (!req.session.clientId) {
        return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
        const Attendance = require('../models/Attendance');
        const Rating = require('../models/Rating');
        const User = require('../models/User');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all past attendance records for this client
        const attendanceRecords = await Attendance.find({
            clientId: req.session.clientId,
            createdAt: { $lt: today }
        }).sort({ createdAt: -1 }).limit(50);

        // Get ratings for these services
        const ratings = await Rating.find({
            clientId: req.session.clientId
        });

        // Create a map of ratings by date/employee
        const ratingMap = {};
        ratings.forEach(r => {
            const key = `${r.employeeId?.toString()}_${new Date(r.createdAt).toDateString()}`;
            ratingMap[key] = r;
        });

        // Enrich with employee names and ratings
        const serviceHistory = await Promise.all(attendanceRecords.map(async (record) => {
            let employeeName = record.employeeName || 'Unknown';

            if (record.employeeId) {
                const employee = await User.findById(record.employeeId).select('username');
                if (employee) employeeName = employee.username;
            }

            // Find matching rating
            const ratingKey = `${record.employeeId?.toString()}_${new Date(record.createdAt).toDateString()}`;
            const rating = ratingMap[ratingKey];

            let duration = null;
            if (record.checkIn?.time && record.checkOut?.time) {
                const diffMs = new Date(record.checkOut.time) - new Date(record.checkIn.time);
                const diffMins = Math.round(diffMs / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            }

            return {
                _id: record._id,
                date: record.createdAt,
                employeeName,
                employeeId: record.employeeId,
                checkInTime: record.checkIn?.time,
                checkOutTime: record.checkOut?.time,
                duration,
                jobCompleted: record.jobCompleted?.confirmed || false,
                safetyConfirmed: record.safetyConfirmation?.confirmed || false,
                rating: rating ? {
                    score: rating.rating,
                    comment: rating.comment
                } : null
            };
        }));

        res.json({ history: serviceHistory });
    } catch (err) {
        console.error('Error fetching service history:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Public client onboarding endpoint (no auth required)
router.post('/onboarding', async (req, res) => {
    try {
        const {
            name, email, phone, address,
            entryInstructions, alarmCode, gateCode, keyLocation,
            lockboxCode, wifiPassword, parkingInstructions,
            petInfo, clientPreferences, areasToAvoid
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !address) {
            return res.status(400).json({ msg: 'Name, email, phone, and address are required' });
        }

        // Check if client already exists
        const existingClient = await Client.findOne({ email: email.toLowerCase() });
        if (existingClient) {
            // Update existing client's property details
            existingClient.propertyDetails = {
                ...existingClient.propertyDetails,
                entryInstructions: entryInstructions || existingClient.propertyDetails?.entryInstructions,
                alarmCode: alarmCode || existingClient.propertyDetails?.alarmCode,
                gateCode: gateCode || existingClient.propertyDetails?.gateCode,
                keyLocation: keyLocation || existingClient.propertyDetails?.keyLocation,
                lockboxCode: lockboxCode || existingClient.propertyDetails?.lockboxCode,
                wifiPassword: wifiPassword || existingClient.propertyDetails?.wifiPassword,
                parkingInstructions: parkingInstructions || existingClient.propertyDetails?.parkingInstructions,
                petInfo: petInfo || existingClient.propertyDetails?.petInfo,
                clientPreferences: clientPreferences || existingClient.propertyDetails?.clientPreferences,
                areasToAvoid: areasToAvoid || existingClient.propertyDetails?.areasToAvoid,
                lastUpdated: new Date(),
                lastUpdatedBy: 'onboarding-form'
            };
            // Update contact info if changed
            existingClient.name = name;
            existingClient.phone = phone;
            existingClient.address = address;
            await existingClient.save();
            return res.json({ msg: 'Your information has been updated successfully!' });
        }

        // Create new client with temporary password (they can request reset later)
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        const newClient = new Client({
            name,
            email: email.toLowerCase(),
            phone,
            address,
            active: true,
            serviceStatus: 'pending',
            propertyDetails: {
                entryInstructions,
                alarmCode,
                gateCode,
                keyLocation,
                lockboxCode,
                wifiPassword,
                parkingInstructions,
                petInfo,
                clientPreferences,
                areasToAvoid,
                lastUpdated: new Date(),
                lastUpdatedBy: 'onboarding-form'
            }
        });

        newClient.setPassword(tempPassword);
        await newClient.save();

        res.status(201).json({
            msg: 'Thank you for registering! Our team will be in touch soon.',
            clientId: newClient._id
        });
    } catch (error) {
        console.error('Error in client onboarding:', error);
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'A client with this email already exists.' });
        }
        res.status(500).json({ msg: 'Server error. Please try again.' });
    }
});

module.exports = router;



