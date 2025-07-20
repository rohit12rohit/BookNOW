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
        // --- CORRECTED ENUM: Added PaymentPending & PaymentFailed ---
        enum: ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'],
        default: 'PaymentPending' // Default when initially created before payment check
        // --- END CORRECTION ---
    },
    // --- Razorpay Fields (or other gateway fields) ---
    // Keep these if you plan to add real payments later
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    // --- End Payment Fields ---
    bookingTime: { // Timestamp when the booking was made
        type: Date,
        default: Date.now
    },
    paymentId: { // Can keep this for simulated payment ID or remove later
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
    }
});

// Index for finding user's bookings easily
BookingSchema.index({ user: 1, bookingTime: -1 });
// Index for finding booking by payment identifiers
BookingSchema.index({ razorpayOrderId: 1 });
BookingSchema.index({ razorpayPaymentId: 1 });


module.exports = mongoose.model('Booking', BookingSchema);
