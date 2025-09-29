// server/models/Event.js
// Purpose: Defines the schema for the Event collection.

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an event title'],
        trim: true,
        unique: true // Assuming event titles should be unique
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: { // e.g., Music, Theatre, Sports, Workshop, Comedy
        type: String,
        required: [true, 'Please specify a category'],
        trim: true,
//      index: true
    },
    eventLanguage: {
        type: String,
        trim: true
    },
    venue: { // Optional: Link to a specific venue if it happens at one place
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        // Not strictly required, event might be multi-venue or online
    },
    address: { // Store address info if no specific venue is linked or for clarity
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
    },
    startDate: { // Start date and time of the event
        type: Date,
        required: [true, 'Please specify the start date and time'],
        // index: true
    },
    endDate: { // End date and time of the event
        type: Date,
        // Not always required, might be single-day event
    },
    imageUrl: { // URL for the event poster or image
        type: String,
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL']
    },
    tags: [{ // Searchable tags like 'concert', 'live music', 'cricket', 'stand-up'
        type: String,
        trim: true,
        lowercase: true
    }],
    organizerInfo: { // Can store organizer name directly or link to User model
        name: { type: String, trim: true },
        contact: { type: String, trim: true }
        // Alternatively, link to the User (organizer/admin) who added it:
        // addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    // Optional fields for ticketing info later (if not using Showtime model)
    // priceInfo: { type: String, trim: true }, // e.g., "Rs. 500 onwards" or "Free Entry"
    // bookingLink: { type: String, trim: true }, // Link to external booking if not handled internally
    status: { // Status of the event listing
        type: String,
        enum: ['Scheduled', 'Postponed', 'Cancelled', 'Completed'],
        default: 'Scheduled'
    },
     organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for searching/filtering
EventSchema.index({ title: 'text', description: 'text' });

// Separate standard indexes for filtering/sorting common fields
EventSchema.index({ category: 1 });        // Index for filtering by category
EventSchema.index({ 'address.city': 1 }); // Index for filtering by city (nested field)
EventSchema.index({ tags: 1 });           // Index the tags array elements for filtering
EventSchema.index({ startDate: 1 });      // Index for sorting/filtering by start date
EventSchema.index({ status: 1 });         // Index for filtering by status
module.exports = mongoose.model('Event', EventSchema);