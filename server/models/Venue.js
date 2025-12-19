// server/models/Venue.js
// Purpose: Defines the schema for the Venue collection, including embedded screens.

const mongoose = require('mongoose');

// Shared Enum for Seat Types (Must match Showtime model)
const SEAT_TYPES = ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Luxury', 'Unavailable'];

// Schema for individual screens within a venue
const ScreenSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: [true, 'Please provide a screen name'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Please provide the screen capacity'],
        min: [1, 'Capacity must be at least 1']
    },
    seatLayout: {
        rows: [{
            _id: false,
            rowId: { 
                type: String, 
                required: true, 
                uppercase: true,
                trim: true
            }, 
            seats: [{
                _id: false,
                seatNumber: { type: String, required: true }, 
                type: {
                    type: String,
                    default: 'Normal',
                    enum: SEAT_TYPES
                },
            }]
        }],
    }
});

// Validator: Ensure Row IDs are unique per screen
ScreenSchema.path('seatLayout.rows').validate(function(rows) {
    if (!rows) return true;
    const rowIds = rows.map(r => r.rowId);
    return new Set(rowIds).size === rowIds.length;
}, 'Row IDs must be unique within a screen.');


// Main schema for the Venue
const VenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a venue name'],
        trim: true,
    },
    address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true, index: true },
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
    },
    facilities: [{
        type: String,
        trim: true
    }],
    screens: [ScreenSchema],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to ensure organizer exists (Optional, depends on preference vs Controller logic)
// Removed empty pre-save hook to keep code clean.

VenueSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.models.Venue || mongoose.model('Venue', VenueSchema);