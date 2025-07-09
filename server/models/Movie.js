// server/models/Movie.js
// Purpose: Defines the schema for the Movie collection.

const mongoose = require('mongoose');
const slugify = require('slugify'); // Ensure slugify is installed in your server's package.json

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a movie title'],
        trim: true,
        unique: true // Assuming movie titles should be unique
    },
    slug: String, // For URL-friendly movie titles
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Please add a release date']
    },
    duration: {
        type: Number, // Duration in minutes
        required: [true, 'Please add the duration in minutes']
    },
    movieLanguage: {
        type: String,
        required: [true, 'Please add the language'],
        trim: true
    },
    genre: [{ // Allow multiple genres
        type: String,
        required: [true, 'Please add at least one genre'],
        trim: true
    }],
    cast: [{ // Array of actor names
        type: String,
        trim: true
    }],
    crew: [{ // Array of key crew members (e.g., "Director: Name", "Music: Name")
        type: String,
        trim: true
    }],
    posterUrl: { // URL to the movie poster image
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow empty URLs
                // UPDATED REGEX: More permissive for valid URLs, including those with query params or no direct extension.
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v) || /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp)(\?.*)?)$/i.test(v);
            },
            message: 'Please enter a valid URL for the poster image.'
        }
    },
    trailerUrl: { // URL to the movie trailer (e.g., YouTube link)
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
    censorRating: {
        type: String, // e.g., 'U', 'U/A', 'A'
        trim: true
    },
    format: [{ // Available formats like 2D, 3D, IMAX
        type: String,
        trim: true,
    }],
    averageRating: {
        type: Number,
        min: 0,
        max: 5, // Match the ReviewSchema rating scale
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },

    addedBy: { // Track which admin/organizer added the movie
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create movie slug from the title before saving
MovieSchema.pre('save', function(next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});

// Optional: Index fields that are frequently queried
MovieSchema.index({ title: 'text', description: 'text' },
     { default_language: 'english' }
);
MovieSchema.index({ genre: 1 });
MovieSchema.index({ movieLanguage: 1 });
MovieSchema.index({ releaseDate: -1 });
MovieSchema.index({ averageRating: -1 });
module.exports = mongoose.model('Movie', MovieSchema);