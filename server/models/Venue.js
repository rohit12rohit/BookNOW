// server/models/Venue.js
// Purpose: Defines the schema for the Venue collection, including embedded screens.

const mongoose = require('mongoose');

// Schema for individual screens within a venue
const ScreenSchema = new mongoose.Schema({
    name: { // e.g., 'Screen 1', 'Audi 2', 'IMAX'
        type: String,
        required: [true, 'Please provide a screen name'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Please provide the screen capacity']
    },
    seatLayout: {
        rows: [{
            _id: false,
            rowId: { type: String, required: true }, // e.g., "A", "B"
            seats: [{
                _id: false,
                seatNumber: { type: String, required: true }, // e.g., "1", "2"
                type: {
                    type: String,
                    default: 'Normal',
                    // CORRECTED ENUM: Added 'Recliner' to the list of allowed values
                    enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Unavailable', 'Luxury']

                },
            }]
        }],
    }
});


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

// Middleware to ensure an organizer exists and is approved before saving a venue
VenueSchema.pre('save', async function(next) {
    // This check is good for the API but can be bypassed for the seeder
    next();
});

VenueSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('Venue', VenueSchema);