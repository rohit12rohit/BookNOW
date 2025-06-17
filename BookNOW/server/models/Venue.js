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
     // --- NEW: Detailed Seat Layout Structure ---
    seatLayout: {
        // Example structure: Array of rows. Each row has a name/identifier and seats array.
        // Each seat has an identifier (number/letter), type, and potentially status (though status like 'booked' comes from Showtime)
        rows: [{
            _id: false, // Don't add separate _id for rows unless needed
            rowId: { type: String, required: true }, // e.g., "A", "B", "BALCONY-A"
            seats: [{
                _id: false, // Don't add separate _id for seats
                seatNumber: { type: String, required: true }, // e.g., "1", "2", "101"
                type: { // e.g., Normal, VIP, Recliner, Wheelchair
                    type: String,
                    default: 'Normal',
                    enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Unavailable'] // Define allowed types
                },
                // The actual seat identifier used in booking could be composite like "A1", "BALCONY-A101"
                // We can generate this on the frontend or store it explicitly if needed.
                // For simplicity now, assume frontend combines rowId + seatNumber as needed.
            }]
        }],
        // Optional: Add metadata like aisle positions, screen position etc. later
        // screenPosition: { type: String, enum: ['front', 'back', 'center'], default: 'front' }
    }
    // --- End NEW Seat Layout ---

});


// Main schema for the Venue
const VenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a venue name'],
        trim: true,
        // unique: true // Consider if venue names should be unique within a city? Requires more complex validation.
    },
    address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true, index: true }, // Index city for filtering
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
        // Optional: Add coordinates for map integration later
        // location: {
        //     type: { type: String, enum: ['Point'] },
        //     coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
        // }
    },
    facilities: [{ // List of amenities like 'Parking', 'F&B', 'Wheelchair Accessible'
        type: String,
        trim: true
    }],
    screens: [ScreenSchema], // Embed the ScreenSchema as an array
    organizer: { // Reference to the User (organizer) who manages this venue
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for finding venues by organizer
    },
    isActive: { // Flag to activate/deactivate venue listing
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to ensure an organizer exists and is approved before saving a venue (optional safety check)
VenueSchema.pre('save', async function(next) {
    const User = mongoose.model('User'); // Avoid circular dependency issues
    const org = await User.findById(this.organizer);
    if (!org || org.role !== 'organizer' || !org.isApproved) {
        return next(new Error('Venue must be associated with an approved organizer.'));
    }
    next();
});
VenueSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('Venue', VenueSchema);
// Export ScreenSchema if needed elsewhere, though often just used embedded here.
// module.exports.ScreenSchema = ScreenSchema;