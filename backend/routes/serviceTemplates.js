const express = require('express');
const router = express.Router();
const ServiceTemplate = require('../models/ServiceTemplate');
const isAdmin = require('./middleware/isAdmin');

// GET all templates (admin only)
router.get('/', isAdmin, async (req, res) => {
    try {
        const templates = await ServiceTemplate.find({ isActive: true }).sort({ name: 1 });
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET single template
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const template = await ServiceTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// CREATE template
router.post('/', isAdmin, async (req, res) => {
    try {
        const template = new ServiceTemplate(req.body);
        await template.save();
        res.json(template);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

// UPDATE template
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const template = await ServiceTemplate.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// DELETE template (soft delete)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        await ServiceTemplate.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ msg: 'Template deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// CALCULATE QUOTE
router.post('/calculate', isAdmin, async (req, res) => {
    try {
        const { templateId, rooms, bathrooms, sqFt, hours, extras, frequency } = req.body;

        const template = await ServiceTemplate.findById(templateId);
        if (!template) {
            return res.status(404).json({ msg: 'Template not found' });
        }

        const quote = template.calculateQuote({
            rooms: parseInt(rooms) || 0,
            bathrooms: parseInt(bathrooms) || 0,
            sqFt: parseFloat(sqFt) || 0,
            hours: parseFloat(hours) || 0,
            extras: extras || [],
            frequency: frequency || 'oneTime'
        });

        res.json({
            template: template.name,
            breakdown: {
                basePrice: template.basePrice,
                roomsCharge: (parseInt(rooms) || 0) * template.pricePerRoom,
                bathroomsCharge: (parseInt(bathrooms) || 0) * template.pricePerBathroom,
                sqFtCharge: (parseFloat(sqFt) || 0) * template.pricePerSqFt,
                hoursCharge: (parseFloat(hours) || 0) * template.pricePerHour,
                extras: (extras || []).map(name => {
                    const e = template.extras.find(x => x.name === name);
                    return e ? { name, price: e.price } : null;
                }).filter(Boolean)
            },
            ...quote
        });
    } catch (error) {
        console.error('Error calculating quote:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

module.exports = router;
