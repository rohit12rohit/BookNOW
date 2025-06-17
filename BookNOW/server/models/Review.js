// server/models/Review.js
// Purpose: Defines the schema for the Review collection.

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5, // Or 10, define your scale
        required: [true, 'Please provide a rating between 1 and 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters'] // Optional length limit
    },
    user: { // User who wrote the review
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movie: { // Movie being reviewed
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Indexes ---
// Prevent user from submitting more than one review per movie
ReviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// --- Static Method to Calculate Average Rating ---
// This function will be called after saving/deleting a review
ReviewSchema.statics.calculateAverageRating = async function(movieId) {
    console.log(`Calculating average rating for movie: ${movieId}`);
    const Movie = mongoose.model('Movie'); // Get Movie model

    // Calculate aggregate statistics
    const stats = await this.aggregate([
        {
            $match: { movie: movieId } // Match reviews for the specific movie
        },
        {
            $group: {
                _id: '$movie', // Group by movie ID
                numberOfReviews: { $sum: 1 }, // Count number of reviews
                averageRating: { $avg: '$rating' } // Calculate average of 'rating' field
            }
        }
    ]);

    // Update the corresponding Movie document
    try {
        if (stats.length > 0) {
            // If there are reviews, update the movie with calculated stats
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: stats[0].numberOfReviews,
                // Round average rating to one decimal place
                averageRating: Math.round(stats[0].averageRating * 10) / 10
            });
            console.log(`Updated movie ${movieId} rating stats:`, stats[0]);
        } else {
            // If no reviews exist (e.g., last review was deleted), reset stats
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: 0,
                averageRating: 0 // Or set to null/undefined if preferred
            });
             console.log(`Reset rating stats for movie ${movieId}`);
        }
    } catch (err) {
        console.error(`Error updating movie rating stats for ${movieId}:`, err);
    }
};

// --- Middleware Hooks ---
// Call calculateAverageRating after saving a review
ReviewSchema.post('save', function() {
    // 'this.constructor' refers to the model (Review)
    this.constructor.calculateAverageRating(this.movie);
});

// Call calculateAverageRating before removing a review (using findByIdAndDelete/remove)
// Need to access the 'movie' field *before* the document is removed
ReviewSchema.pre('remove', function(next) {
    // Store the movie ID on the instance to access it in post('remove') hook
    this._movieIdToRemove = this.movie;
    next();
});
ReviewSchema.post('remove', function() {
     // Use the stored ID
     if (this._movieIdToRemove) {
        this.constructor.calculateAverageRating(this._movieIdToRemove);
     }
});

// Note: If using findOneAndUpdate/findOneAndDelete, the above pre/post('remove') hooks won't trigger.
// You would need to handle the update calculation within the update/delete controller logic itself
// or use different middleware if that's your primary way of modifying reviews.
// We'll use .remove() on the document in the delete controller for simplicity here.


module.exports = mongoose.model('Review', ReviewSchema);