// server/models/PromoCode.js
// Purpose: Defines the schema for the PromoCode collection.

const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    code: { // The actual code users enter (e.g., 'SUMMER25')
        type: String,
        required: [true, 'Please provide a promo code'],
        unique: true,
        trim: true,
        uppercase: true, // Store codes in uppercase for case-insensitive matching
        index: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'] // Type of discount
    },
    discountValue: { // The amount/percentage of discount
        type: Number,
        required: [true, 'Please specify the discount value'],
        min: 0
    },
    description: { // Optional description for admin reference
        type: String,
        trim: true
    },
    minPurchaseAmount: { // Minimum booking total required to use the code
        type: Number,
        default: 0
    },
    maxDiscountAmount: { // Maximum discount amount (especially for percentage codes)
        type: Number,
        // No default, null means no limit unless set
    },
    validFrom: { // Optional start date for the code's validity
        type: Date,
    },
    validUntil: { // Optional expiry date for the code's validity
        type: Date,
        index: true // Index for checking expiry
    },
    maxUses: { // Optional: Maximum total number of times the code can be used
        type: Number,
        min: 1
        // null means unlimited uses
    },
    uses: { // Counter for how many times the code has been used
        type: Number,
        default: 0
    },
    isActive: { // Allows admin to enable/disable the code
        type: Boolean,
        default: true,
        index: true
    },
    // Optional: Add field for 'applicableTo' (e.g., specific movies, users, events) later
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to check if the code is currently valid (within date range, not expired uses)
PromoCodeSchema.methods.isValid = function() {
    const now = new Date();
    let valid = this.isActive;

    if (this.validFrom && this.validFrom > now) {
        valid = false; // Not started yet
    }
    if (this.validUntil && this.validUntil < now) {
        valid = false; // Expired
    }
    if (this.maxUses && this.uses >= this.maxUses) {
        valid = false; // Usage limit reached
    }
    return valid;
};

// Method to calculate discount (centralizes logic)
PromoCodeSchema.methods.calculateDiscount = function(originalAmount) {
    let discount = 0;
    if (!this.isValid()) return 0; // Double check validity

    // Check min purchase amount
    if (originalAmount < this.minPurchaseAmount) {
        return 0; // Doesn't meet minimum spend
    }

    // Calculate discount based on type
    if (this.discountType === 'percentage') {
        discount = originalAmount * (this.discountValue / 100);
        // Apply max discount cap if set for percentage
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else if (this.discountType === 'fixed') {
        discount = this.discountValue;
        // Ensure fixed discount doesn't exceed original amount
        if (discount > originalAmount) {
             discount = originalAmount;
        }
    }

    return Math.round(discount * 100) / 100; // Return discount rounded to 2 decimal places
};


module.exports = mongoose.model('PromoCode', PromoCodeSchema);