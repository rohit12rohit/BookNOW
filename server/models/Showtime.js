// server/models/Showtime.js
const mongoose = require('mongoose');

const PriceTierSchema = new mongoose.Schema({
    _id: false,
    seatType: {
        type: String,
        required: [true, 'Seat type is required for a price tier (e.g., Normal, VIP)'],
        // This should align with Venue.screens.seatLayout.seats.type
        enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Luxury'] 
    },
    price: {
        type: Number,
        required: [true, 'Price is required for the seat type'],
        min: [0, 'Price cannot be negative']
    }
});

const ShowtimeSchema = new mongoose.Schema({
    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie', 
        index: true 
    },
    event: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Event', 
        index: true 
    },
    venue: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Venue', 
        required: true, 
        index: true 
    },
    screenId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    screenName: { 
        type: String, 
        required: true 
    },
    startTime: { 
        type: Date, 
        required: true, 
        index: true 
    },
    endTime: { 
        type: Date, 
        required: true 
    },
    totalSeats: { 
        type: Number, 
        required: true 
    },
    bookedSeats: [{ 
        type: String 
    }],
    priceTiers: {
        type: [PriceTierSchema],
        required: true,
        validate: [
            { 
                validator: arr => arr && arr.length > 0, 
                msg: 'At least one price tier must be defined for the showtime.' 
            },
            {
                validator: function(tiers) {
                    const seatTypes = tiers.map(t => t.seatType);
                    return new Set(seatTypes).size === seatTypes.length;
                },
                msg: 'Seat types in priceTiers must be unique for this showtime.'
            }
        ]
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

// Ensure logic consistency: A showtime is for a Movie OR an Event, not both.
ShowtimeSchema.pre('validate', function(next) {
    if (this.movie && this.event) {
        next(new Error('Showtime cannot be linked to both a Movie and an Event.'));
    } else if (!this.movie && !this.event) {
        next(new Error('Showtime must be linked to either a Movie or an Event.'));
    } else {
        next();
    }
});

// Compound indexes for common search queries
ShowtimeSchema.index({ movie: 1, venue: 1, startTime: 1 });
ShowtimeSchema.index({ event: 1, venue: 1, startTime: 1 });

module.exports = mongoose.models.Showtime || mongoose.model('Showtime', ShowtimeSchema);