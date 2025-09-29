// server/models/Booking.js
// Purpose: Defines the schema for the Booking collection.

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingRefId: {
        type: String,
        required: true,
        unique: true, // Ensure uniqueness
        index: true,  // Index for faster lookup by ref ID
        maxlength: 10 // Optional: Set max length if needed
    },
    user: { // The user who made the booking
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    showtime: { // The specific showtime booked
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true,
        index: true
    },
    seats: [{ // Array of seat identifiers booked (e.g., "A1", "C5")
        type: String,
        required: [true, 'At least one seat must be selected']
    }],
    totalAmount: { // Final amount after discount
        type: Number,
        required: true,
        min: 0
    },
    originalAmount: { // Store amount *before* discount for reference
        type: Number,
    },
    promoCodeApplied: { // Reference the PromoCode document
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode',
    },
    discountAmount: { // Store the actual discount value applied
        type: Number,
        default: 0
    },
    status: { // Status of the booking
        type: String,
        enum: ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'],
        default: 'PaymentPending'
    },
    // --- Razorpay Fields ---
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    bookingTime: { // Timestamp when the booking was made
        type: Date,
        default: Date.now
    },
    paymentId: {
        type: String,
    },
    isCheckedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    checkedInBy: { // Admin/Organizer who scanned the QR code
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    qrCodeData: { // Field to store the detailed QR code string
        type: String,
    }
});

// Index for finding user's bookings easily
BookingSchema.index({ user: 1, bookingTime: -1 });
// Index for finding booking by payment identifiers
BookingSchema.index({ razorpayOrderId: 1 });
BookingSchema.index({ razorpayPaymentId: 1 });


module.exports = mongoose.model('Booking', BookingSchema);