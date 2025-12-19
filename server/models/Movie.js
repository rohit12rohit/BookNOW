// server/models/Movie.js
// Purpose: Defines the schema for the Movie collection in MongoDB.

const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a movie title'],
        trim: true, 
        unique: true
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
        required: [true, 'Please add the duration in minutes'],
        min: [1, 'Duration must be at least 1 minute']
    },
    movieLanguage: {
        type: String,
        required: [true, 'Please add the language'],
        trim: true
    },
    genre: [{ 
        type: String,
        required: [true, 'Please add at least one genre'],
        trim: true
    }],
    cast: [{ 
        type: String,
        trim: true
    }],
    crew: [{ 
        type: String,
        trim: true
    }],
    posterUrl: { 
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v);
            },
            message: 'Please use a valid URL for poster'
        }
    },
    trailerUrl: { 
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v);
            },
            message: 'Please use a valid URL for trailer'
        }
    },
    censorRating: {
        type: String,
        trim: true,
        uppercase: true // e.g., 'U/A'
    },
    format: [{ 
        type: String,
        trim: true,
        uppercase: true // Force '2D', '3D', 'IMAX' consistency
    }],
    averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    addedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

MovieSchema.index({ title: 'text', description: 'text' }, { default_language: 'english' });
MovieSchema.index({ genre: 1 });
MovieSchema.index({ movieLanguage: 1 });
MovieSchema.index({ releaseDate: -1 });

module.exports = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);