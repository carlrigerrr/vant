const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceTemplateSchema = new Schema({
    // Template identification
    name: { type: String, required: true }, // e.g., "Deep Clean", "Regular Cleaning"
    description: { type: String, default: '' },

    // Base pricing
    basePrice: { type: Number, default: 0 }, // Starting price

    // Per-unit pricing (all optional)
    pricePerRoom: { type: Number, default: 0 },
    pricePerBathroom: { type: Number, default: 0 },
    pricePerSqFt: { type: Number, default: 0 },
    pricePerHour: { type: Number, default: 0 },

    // Add-ons / extras
    extras: [{
        name: { type: String, required: true }, // e.g., "Oven cleaning", "Fridge cleaning"
        price: { type: Number, required: true }
    }],

    // Frequency discounts (percentage)
    frequencyDiscounts: {
        weekly: { type: Number, default: 15 },      // 15% off for weekly
        biweekly: { type: Number, default: 10 },    // 10% off for bi-weekly
        monthly: { type: Number, default: 5 },      // 5% off for monthly
        oneTime: { type: Number, default: 0 }       // No discount
    },

    // Status
    isActive: { type: Boolean, default: true },

    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Calculate quote from inputs
ServiceTemplateSchema.methods.calculateQuote = function (inputs = {}) {
    const { rooms = 0, bathrooms = 0, sqFt = 0, hours = 0, extras = [], frequency = 'oneTime' } = inputs;

    let total = this.basePrice;
    total += rooms * this.pricePerRoom;
    total += bathrooms * this.pricePerBathroom;
    total += sqFt * this.pricePerSqFt;
    total += hours * this.pricePerHour;

    // Add selected extras
    extras.forEach(extraName => {
        const extra = this.extras.find(e => e.name === extraName);
        if (extra) {
            total += extra.price;
        }
    });

    // Apply frequency discount
    const discountPercent = this.frequencyDiscounts[frequency] || 0;
    const discount = total * (discountPercent / 100);
    const finalTotal = total - discount;

    return {
        subtotal: Math.round(total * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        discountPercent,
        total: Math.round(finalTotal * 100) / 100
    };
};

module.exports = mongoose.model('ServiceTemplate', ServiceTemplateSchema);
