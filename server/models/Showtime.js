// // server/models/Showtime.js
// // Purpose: Defines the schema for the Showtime collection.

// const mongoose = require('mongoose');
// const Movie = require('./Movie'); // Needed for duration lookup
// const Venue = require('./Venue'); // Needed for screen validation

// const ShowtimeSchema = new mongoose.Schema({
//     movie: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Movie',
//         required: true,
//         index: true
//     },
//     venue: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Venue',
//         required: true,
//         index: true
//     },
//     screenId: { // Store the _id of the screen within the Venue's screens array
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//     },
//     screenName: { // Store the name for easier display/reference
//         type: String,
//         required: true,
//     },
//     startTime: { // Date and time when the show starts
//         type: Date,
//         required: true,
//         index: true
//     },
//     endTime: { // Date and time when the show ends (calculated)
//         type: Date,
//         required: true // Store calculated end time
//     },
//     totalSeats: { // Capacity of the screen for this showtime
//         type: Number,
//         required: true
//     },
//     bookedSeats: [{ // Array of seat identifiers that are booked (e.g., "A1", "B12")
//         type: String,
//         // Example structure: { row: 'A', number: 1, status: 'booked' } might be more flexible later
//     }],
//     price: { // Ticket price for this showtime (can evolve to tiered pricing)
//         type: Number,
//         required: true,
//         min: 0
//     },
//     isActive: { // Flag to activate/deactivate showtime listing
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
//     // No need to store organizer directly, it's derived from the venue reference.
// });


// // --- Validation: Ensure either movie OR event is set, but not both ---
// ShowtimeSchema.pre('validate', function(next) {
//     if (this.movie && this.event) {
//         next(new Error('Showtime cannot be linked to both a Movie and an Event.'));
//     } else if (!this.movie && !this.event) {
//         next(new Error('Showtime must be linked to either a Movie or an Event.'));
//     } else {
//         next();
//     }
// });


// // --- Pre-save Middleware (or Controller Logic) Adjustment ---
// // If you moved the calculation logic to the controller, you'll need to adjust it there.
// // If you are still using the (previously problematic) pre-save hook, adjust it like this:
// /* // --- COMMENTED OUT Example Adjustment for Pre-save Hook ---
// ShowtimeSchema.pre('save', async function(next) {
//     const MovieModel = mongoose.model('Movie');
//     const EventModel = mongoose.model('Event'); // Get Event model too
//     const VenueModel = mongoose.model('Venue');

//     console.log('[Showtime Pre-Save] Hook triggered for:', this._id || 'New Document');

//     if (this.isNew || this.isModified('startTime') || this.isModified('movie') || this.isModified('event') || this.isModified('screenId')) {
//         console.log('[Showtime Pre-Save] Calculating endTime, totalSeats, screenName...');
//          console.log(`[Showtime Pre-Save] Input IDs: Movie=${this.movie}, Event=${this.event}, Venue=${this.venue}, Screen=${this.screenId}`);

//         try {
//             let itemDurationMs;
//             const startTimeMs = this.startTime.getTime();
//             const bufferMs = 15 * 60 * 1000; // 15 min buffer

//             // 1. Get Duration/End Time based on Movie or Event
//             if (this.movie) {
//                 const movie = await MovieModel.findById(this.movie).select('duration title');
//                 console.log('[Showtime Pre-Save] Found Movie:', movie ? movie.title : 'Not Found');
//                 if (!movie || !movie.duration) throw new Error(`Movie not found (ID: ${this.movie}) or duration missing.`);
//                 itemDurationMs = movie.duration * 60 * 1000;
//                 this.endTime = new Date(startTimeMs + itemDurationMs + bufferMs); // Calculate endTime for movie
//             } else if (this.event) {
//                 const event = await EventModel.findById(this.event).select('startDate endDate title');
//                  console.log('[Showtime Pre-Save] Found Event:', event ? event.title : 'Not Found');
//                 if (!event) throw new Error(`Event not found (ID: ${this.event}).`);
//                 // For events, use the event's predefined end time if available, otherwise maybe calculate based on start + default?
//                 // Let's assume event booking uses the event's own schedule. The showtime might just represent the entry window.
//                 // Or, if the event has an endDate, use that? Let's use Event's endDate if present.
//                 this.endTime = event.endDate || new Date(startTimeMs + (120 * 60 * 1000)); // Use event's end date or default to 2 hours? Needs business logic decision.
//                 // For simplicity, maybe endTime isn't strictly required if it's an Event showtime? Or maybe it's set explicitly?
//                  // Let's just calculate based on a default duration for now if event endDate is missing.
//                  if (!event.endDate) console.warn(`[Showtime Pre-Save] Event ${event._id} missing endDate, using default calculation for showtime endTime.`);

//             } else {
//                  throw new Error('Showtime lacks both movie and event reference.'); // Should be caught by pre-validate
//             }
//              console.log('[Showtime Pre-Save] Determined endTime:', this.endTime);


//             // 2. Find Venue & Screen (Logic remains the same)
//             const venue = await VenueModel.findById(this.venue);
//             // ... (venue/screen finding logic as before) ...
//             const screen = venue.screens.id(this.screenId);
//             // ... (check screen exists) ...
//             this.totalSeats = screen.capacity;
//             this.screenName = screen.name;
//             console.log(`[Showtime Pre-Save] Set totalSeats=${this.totalSeats}, screenName=${this.screenName}`);

//             next();
//         } catch (error) {
//             console.error("[Showtime Pre-Save] Error caught:", error.message);
//             next(error);
//         }
//     } else {
//         next();
//     }
// });
// */ // --- End COMMENTED OUT Hook Example ---



// // Index for common queries: find shows for a movie at a venue on a specific date range
// ShowtimeSchema.index({ movie: 1, venue: 1, startTime: 1 });

// module.exports = mongoose.model('Showtime', ShowtimeSchema);


// // server/models/Showtime.js
// const mongoose = require('mongoose');
// // Movie and Venue models are not directly needed for this schema definition itself,
// // but their names are used in `ref`.

// const PriceTierSchema = new mongoose.Schema({
//     _id: false, // Don't create a separate _id for subdocuments unless needed
//     seatType: {
//         type: String,
//         required: [true, 'Seat type is required for a price tier (e.g., Normal, VIP)'],
//         // Consider syncing this with the enum in Venue.ScreenSchema.seatLayout.seats.type
//         // enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Unavailable'] // Optional: enforce consistency
//     },
//     price: {
//         type: Number,
//         required: [true, 'Price is required for the seat type'],
//         min: [0, 'Price cannot be negative']
//     }
// });

// const ShowtimeSchema = new mongoose.Schema({
//     movie: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Movie',
//         index: true
//         // Required conditionally by pre-validate hook
//     },
//     event: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Event',
//         index: true
//         // Required conditionally by pre-validate hook
//     },
//     venue: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Venue',
//         required: true,
//         index: true
//     },
//     screenId: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//     },
//     screenName: {
//         type: String,
//         required: true,
//     },
//     startTime: {
//         type: Date,
//         required: true,
//         index: true
//     },
//     endTime: {
//         type: Date,
//         required: true
//     },
//     totalSeats: { // Capacity of the screen for this showtime
//         type: Number,
//         required: true
//     },
//     bookedSeats: [{ // Array of seat identifiers that are booked (e.g., "A1", "B12")
//         type: String,
//     }],
//     // --- MODIFIED PRICE FIELD ---
//     // price: { // Old single price field - REMOVE THIS or comment out
//     //     type: Number,
//     //     // required: true, // No longer the primary price field
//     //     min: 0
//     // },
//     priceTiers: { // New field for tiered pricing
//         type: [PriceTierSchema],
//         required: true,
//         validate: [
//             { validator: arr => arr.length > 0, msg: 'At least one price tier must be defined.' },
//             { // Ensure unique seat types within priceTiers for a showtime
//                 validator: function(tiers) {
//                     if (!tiers || tiers.length === 0) return true;
//                     const seatTypes = tiers.map(t => t.seatType);
//                     return new Set(seatTypes).size === seatTypes.length;
//                 },
//                 msg: 'Seat types in priceTiers must be unique for a showtime.'
//             }
//         ]
//     },
//     // --- END MODIFIED PRICE FIELD ---
//     isActive: {
//         type: Boolean,
//         default: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// ShowtimeSchema.pre('validate', function(next) {
//     if (this.movie && this.event) {
//         next(new Error('Showtime cannot be linked to both a Movie and an Event.'));
//     } else if (!this.movie && !this.event) {
//         next(new Error('Showtime must be linked to either a Movie or an Event.'));
//     } else {
//         next();
//     }
// });

// // Commented out pre-save hook for endTime, totalSeats, screenName as these
// // are now calculated in the controller before saving.
// /*
// ShowtimeSchema.pre('save', async function(next) { ... });
// */

// ShowtimeSchema.index({ movie: 1, venue: 1, startTime: 1 });
// ShowtimeSchema.index({ event: 1, venue: 1, startTime: 1 }); // If you have event showtimes

// module.exports = mongoose.model('Showtime', ShowtimeSchema);







// server/models/Showtime.js
const mongoose = require('mongoose');

const PriceTierSchema = new mongoose.Schema({
    _id: false,
    seatType: {
        type: String,
        required: [true, 'Seat type is required for a price tier (e.g., Normal, VIP)'],
        // Consider this enum based on your Venue model's ScreenSchema.seatLayout.seats.type
        // enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair'] // Exclude 'Unavailable' from pricing
    },
    price: {
        type: Number,
        required: [true, 'Price is required for the seat type'],
        min: [0, 'Price cannot be negative']
    }
});

const ShowtimeSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', index: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    screenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    screenName: { type: String, required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: [{ type: String }],
    priceTiers: {
        type: [PriceTierSchema],
        required: true,
        validate: [
            { validator: arr => arr && arr.length > 0, msg: 'At least one price tier must be defined for the showtime.' },
            {
                validator: function(tiers) {
                    const seatTypes = tiers.map(t => t.seatType);
                    return new Set(seatTypes).size === seatTypes.length;
                },
                msg: 'Seat types in priceTiers must be unique for this showtime.'
            }
        ]
    },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

ShowtimeSchema.pre('validate', function(next) {
    if (this.movie && this.event) {
        next(new Error('Showtime cannot be linked to both a Movie and an Event.'));
    } else if (!this.movie && !this.event) {
        next(new Error('Showtime must be linked to either a Movie or an Event.'));
    } else {
        next();
    }
});

ShowtimeSchema.index({ movie: 1, venue: 1, startTime: 1 });
ShowtimeSchema.index({ event: 1, venue: 1, startTime: 1 });

module.exports = mongoose.models.Showtime || mongoose.model('Showtime', ShowtimeSchema);