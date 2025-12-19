// server/models/Booking.js
// Purpose: Defines the schema for the Booking collection.

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingRefId: {
        type: String,
        required: true,
        unique: true, 
        index: true,  
        maxlength: 20 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    showtime: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true,
        index: true
    },
    seats: {
        type: [String], // e.g., ["A1", "C5"]
        required: [true, 'At least one seat must be selected'],
        validate: [
            {
                validator: function(seats) {
                    return seats.length > 0;
                },
                message: 'At least one seat must be selected.'
            },
            {
                validator: function(seats) {
                    // Prevent duplicates in the SAME booking request
                    return new Set(seats).size === seats.length;
                },
                message: 'Duplicate seats detected in booking.'
            }
        ]
    },
    totalAmount: { 
        type: Number,
        required: true,
        min: 0
    },
    originalAmount: { 
        type: Number,
        min: 0
    },
    promoCodeApplied: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode',
    },
    discountAmount: { 
        type: Number,
        default: 0,
        min: 0
    },
    status: { 
        type: String,
        enum: ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'],
        default: 'PaymentPending'
    },
    // --- Razorpay Fields ---
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    bookingTime: { 
        type: Date,
        default: Date.now
    },
    isCheckedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    checkedInBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    qrCodeData: { 
        type: String,
    }
});

// Index for finding user's bookings (Most common query)
BookingSchema.index({ user: 1, bookingTime: -1 });

// Indexes for Payment Reconciliation
BookingSchema.index({ razorpayOrderId: 1 });
BookingSchema.index({ razorpayPaymentId: 1 });

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);