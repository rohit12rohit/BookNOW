// server/models/Movie.js
// Purpose: Defines the schema for the Movie collection in MongoDB.

const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a movie title'],
        trim: true, // Remove whitespace
        unique: true // Assuming movie titles should be unique
    },
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
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL for poster']
        // required: true // Consider if poster is mandatory
    },
    trailerUrl: { // URL to the movie trailer (e.g., YouTube link)
        type: String,
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL for trailer']
    },
    censorRating: {
        type: String, // e.g., 'U', 'U/A', 'A'
        trim: true
    },
    format: [{ // Available formats like 2D, 3D, IMAX
        type: String,
        trim: true,
        // enum: ['2D', '3D', 'IMAX', '4DX'] // Optional: restrict to specific formats
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

// Optional: Index fields that are frequently queried
MovieSchema.index({ title: 'text', description: 'text' },
     { default_language: 'english' }
); // Example indexing

// Separate standard indexes for filtering/sorting common fields
MovieSchema.index({ genre: 1 });      // Index the genre array elements for filtering
MovieSchema.index({ movieLanguage: 1 });   // Index language for filtering
MovieSchema.index({ releaseDate: -1 });// Index for sorting by release date
MovieSchema.index({ averageRating: -1 });// Index for sorting by rating
module.exports = mongoose.model('Movie', MovieSchema);