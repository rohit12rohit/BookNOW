// server/models/Review.js
// Purpose: Defines the schema for the Review collection, including interactions.

const mongoose = require('mongoose');

// A sub-schema for tracking reports on a review
const ReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: [true, 'A reason is required for reporting a review.'],
        trim: true,
        maxlength: [200, 'Report reason cannot exceed 200 characters.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide a rating between 1 and 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    // --- Fields for Review Interactions ---
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reports: [ReportSchema],
    // --- End Interaction Fields ---
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent a user from submitting more than one review per movie
ReviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// Static method to calculate and update the average rating on the Movie model
ReviewSchema.statics.calculateAverageRating = async function(movieId) {
    const Movie = mongoose.model('Movie');
    try {
        const stats = await this.aggregate([
            { $match: { movie: movieId } },
            {
                $group: {
                    _id: '$movie',
                    numberOfReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        const updateData = {
            numberOfReviews: stats[0]?.numberOfReviews || 0,
            averageRating: stats[0]?.averageRating ? Math.round(stats[0].averageRating * 10) / 10 : 0
        };

        await Movie.findByIdAndUpdate(movieId, updateData);
        console.log(`Updated rating stats for movie ${movieId}:`, updateData);
    } catch (err) {
        console.error(`Error updating movie rating stats for ${movieId}:`, err);
    }
};

// Middleware hooks to automatically update ratings on save or remove
ReviewSchema.post('save', function() { this.constructor.calculateAverageRating(this.movie); });
ReviewSchema.post('remove', function() { this.constructor.calculateAverageRating(this.movie); });

module.exports = mongoose.model('Review', ReviewSchema);