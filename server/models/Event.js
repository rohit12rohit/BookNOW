// server/models/Event.js
// Purpose: Defines the schema for the Event collection.

const mongoose = require('mongoose');
const slugify = require('slugify'); // Ensure slugify is installed in your server's package.json

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an event title'],
        trim: true,
        unique: true
    },
    slug: String, // For URL-friendly event titles
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please specify a category'],
        trim: true,
    },
    eventLanguage: {
        type: String,
        trim: true
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
    },
    location: { // NEW: location field is explicitly required
        type: String,
        required: [true, 'Please add the event location'],
        trim: true
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
    },
    startDate: {
        type: Date,
        required: [true, 'Please specify the start date and time'],
    },
    endDate: {
        type: Date,
    },
    imageUrl: { // URL for the event poster or image
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty URLs
                // UPDATED REGEX: More permissive for general image URLs
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v) || /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp)(\?.*)?)$/i.test(v);
            },
            message: 'Please enter a valid URL for the image.'
        }
    },
    trailerUrl: { // Trailer URL for events
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty URLs
                // UPDATED REGEX: More permissive for YouTube URLs
                return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/.test(v);
            },
            message: 'Please enter a valid YouTube URL for the trailer.'
        }
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    organizerInfo: {
        name: { type: String, trim: true },
        contact: { type: String, trim: true }
    },
    status: {
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

// Create event slug from the title before saving
EventSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});

// Indexes for searching/filtering
EventSchema.index({ title: 'text', description: 'text', 'address.city': 'text', category: 'text', tags: 'text' });
EventSchema.index({ category: 1 });
EventSchema.index({ 'address.city': 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ organizer: 1 });

module.exports = mongoose.model('Event', EventSchema);