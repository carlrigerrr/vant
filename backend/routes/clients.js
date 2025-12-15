const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.admin) {
        return next();
    }
    res.status(401).json({ msg: 'Unauthorized' });
};

// Get all clients (admin only - full data)
router.get('/', isAdmin, async (req, res) => {
    try {
        const clients = await Client.find().select('-hash -salt').sort({ createdAt: -1 });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get clients for employees (filtered - hides contacts if hideContacts is true, respects shareLocation)
router.get('/public', async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        const clients = await Client.find({ active: true })
            .select('-hash -salt')
            .sort({ name: 1 });

        // Filter out contact info and location based on privacy settings
        const filteredClients = clients.map(client => {
            const clientObj = client.toObject();

            // Base response for all clients
            const response = {
                _id: clientObj._id,
                name: clientObj.name,
                address: clientObj.address,
                serviceStatus: clientObj.serviceStatus,
                nextServiceDate: clientObj.nextServiceDate
            };

            // Handle contact info visibility
            if (clientObj.hideContacts && !req.user.admin) {
                response.email = '(hidden)';
                response.phone = '(hidden)';
            } else {
                response.email = clientObj.email;
                response.phone = clientObj.phone;
            }

            // Handle location visibility based on shareLocation
            if (clientObj.shareLocation !== false) {
                response.location = clientObj.location;
            } else {
                // Only show formatted address, hide GPS coordinates
                response.location = {
                    formattedAddress: clientObj.location?.formattedAddress || clientObj.address || '',
                    coordinates: null,
                    shareLocation: false
                };
            }

            return response;
        });

        res.json(filteredClients);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});


// Create new client (admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, email, phone, address, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Name, email, and password are required' });
        }

        // Check if client already exists
        const existingClient = await Client.findOne({ email: email.toLowerCase() });
        if (existingClient) {
            return res.status(400).json({ msg: 'Client with this email already exists' });
        }

        const client = new Client({
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            address: address || ''
        });

        client.setPassword(password);
        await client.save();

        res.json({
            msg: 'Client created successfully',
            client: {
                _id: client._id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                active: client.active
            }
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ msg: error.message || 'Server error' });
    }
});

// Update client (admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { name, email, phone, address, active, password, serviceStatus, nextServiceDate, lastServiceDate, serviceNotes, hideContacts } = req.body;

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        if (name) client.name = name;
        if (email) client.email = email.toLowerCase();
        if (phone !== undefined) client.phone = phone;
        if (address !== undefined) client.address = address;
        if (active !== undefined) client.active = active;
        if (password) client.setPassword(password);
        if (serviceStatus) client.serviceStatus = serviceStatus;
        if (nextServiceDate !== undefined) client.nextServiceDate = nextServiceDate ? new Date(nextServiceDate) : null;
        if (lastServiceDate !== undefined) client.lastServiceDate = lastServiceDate ? new Date(lastServiceDate) : null;
        if (serviceNotes !== undefined) client.serviceNotes = serviceNotes;
        if (hideContacts !== undefined) client.hideContacts = hideContacts;

        await client.save();

        res.json({
            msg: 'Client updated successfully',
            client: {
                _id: client._id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                active: client.active,
                serviceStatus: client.serviceStatus,
                nextServiceDate: client.nextServiceDate,
                lastServiceDate: client.lastServiceDate,
                serviceNotes: client.serviceNotes
            }
        });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete client (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// ==================== CLIENT BIBLE / PROPERTY DETAILS ====================

// Update property details (admin only)
router.put('/:id/property-details', isAdmin, async (req, res) => {
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
            areasToAvoid,
            internalNotes
        } = req.body;

        const updateData = {
            'propertyDetails.lastUpdated': new Date(),
            'propertyDetails.lastUpdatedBy': 'admin'
        };

        // Only update fields that are provided
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
        if (internalNotes !== undefined) updateData['propertyDetails.internalNotes'] = internalNotes;

        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-hash -salt');

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json({
            msg: 'Property details updated successfully',
            propertyDetails: client.propertyDetails
        });
    } catch (error) {
        console.error('Error updating property details:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Get property details for a client (admin only)
router.get('/:id/property-details', isAdmin, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .select('name propertyDetails');

        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        res.json({
            clientId: client._id,
            clientName: client.name,
            propertyDetails: client.propertyDetails || {}
        });
    } catch (error) {
        console.error('Error fetching property details:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Photo upload configuration
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
        cb(null, 'property-' + uniqueSuffix + path.extname(file.originalname));
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

// Upload property photo (admin only)
router.post('/:id/property-photos', isAdmin, photoUpload.single('photo'), async (req, res) => {
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
            req.params.id,
            {
                $push: { 'propertyDetails.photos': photoData },
                $set: { 'propertyDetails.lastUpdated': new Date() }
            },
            { new: true }
        ).select('propertyDetails.photos');

        if (!client) {
            // Clean up uploaded file if client not found
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
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete property photo (admin only)
router.delete('/:id/property-photos/:photoIndex', isAdmin, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).select('propertyDetails.photos');
        if (!client) {
            return res.status(404).json({ msg: 'Client not found' });
        }

        const photoIndex = parseInt(req.params.photoIndex);
        const photos = client.propertyDetails?.photos || [];

        if (photoIndex < 0 || photoIndex >= photos.length) {
            return res.status(400).json({ msg: 'Invalid photo index' });
        }

        const photoToDelete = photos[photoIndex];

        // Try to delete the file from disk
        if (photoToDelete.url) {
            const filePath = path.join(__dirname, '..', photoToDelete.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Remove from database
        photos.splice(photoIndex, 1);
        await Client.findByIdAndUpdate(req.params.id, {
            $set: {
                'propertyDetails.photos': photos,
                'propertyDetails.lastUpdated': new Date()
            }
        });

        res.json({ msg: 'Photo deleted successfully' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;


