// File: /server/controllers/reviewController.js
// Purpose: Contains logic for handling review-related API requests.

const Review = require('../models/Review');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking'); // Needed to check if user booked the movie
const Showtime = require('../models/Showtime'); // Might need for booking check
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');


// @desc    Get all reviews for a specific movie
// @route   GET /api/movies/:movieId/reviews
// @access  Public
exports.getReviewsForMovie = async (req, res) => {
    const movieId = req.params.movieId;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({ msg: 'Invalid Movie ID format' });
    }

    try {
        // Check if movie exists
        const movieExists = await Movie.findById(movieId);
        if (!movieExists) {
             return res.status(404).json({ msg: 'Movie not found' });
        }

        const reviews = await Review.find({ movie: movieId })
                                    .populate('user', 'name') // Populate user's name
                                    .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (err) {
        console.error('Error fetching reviews for movie:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Get all reviews written by the logged-in user
// @route   GET /api/reviews/me
// @access  Private
exports.getMyReviews = async (req, res) => {
    const userId = req.user.id;
    try {
        const reviews = await Review.find({ user: userId })
                                    .populate('movie', 'title posterUrl') // Populate movie title/poster
                                    .sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) {
        console.error('Error fetching user reviews:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Create a new review for a movie
// @route   POST /api/movies/:movieId/reviews
// @access  Private
exports.createReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const movieId = req.params.movieId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({ msg: 'Invalid Movie ID format' });
    }

    try {
        // 1. Check if movie exists
        const movieExists = await Movie.findById(movieId);
        if (!movieExists) {
             return res.status(404).json({ msg: 'Movie not found' });
        }

        // 2. Check if user has already reviewed this movie
        const existingReview = await Review.findOne({ movie: movieId, user: userId });
        if (existingReview) {
            return res.status(400).json({ msg: 'You have already submitted a review for this movie' });
        }

        // 3. **Constraint Check:** Verify if the user has a confirmed booking for this movie
        // Find showtimes for this movie
        const showtimeIds = await Showtime.find({ movie: movieId }).distinct('_id');
        if (showtimeIds.length === 0) {
            // Technically shouldn't happen if movie exists, but safety check
             return res.status(400).json({ msg: 'No showtimes found for this movie to verify booking.' });
        }
        // Check if user has a CONFIRMED or CHECKED_IN booking for any of these showtimes
        const userBooking = await Booking.findOne({
            user: userId,
            showtime: { $in: showtimeIds },
            status: { $in: ['Confirmed', 'CheckedIn'] }
        });

        if (!userBooking) {
            return res.status(403).json({ msg: 'You must have a confirmed booking for this movie to leave a review.' });
        }

        // 4. Create and save the new review
        const newReview = new Review({
            rating,
            comment,
            user: userId,
            movie: movieId
        });

        const review = await newReview.save(); // Post-save hook will trigger average calculation

        // Populate user name for the response
        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(201).json(populatedReview);

    } catch (err) {
        console.error('Error creating review:', err.message);
         // Handle potential duplicate key error if index constraint fails unexpectedly
        if (err.code === 11000) {
             return res.status(400).json({ msg: 'You have already submitted a review for this movie (duplicate key).' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Update a review written by the user
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    try {
        let review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Authorization: Check if the logged-in user owns this review
        if (review.user.toString() !== userId) {
            return res.status(403).json({ msg: 'User not authorized to update this review' });
        }

        // Update fields
        if (rating !== undefined) review.rating = rating;
        if (comment !== undefined) review.comment = comment;

        // Save updated review (post-save hook triggers recalculation)
        await review.save();

         // Populate user name for the response
        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(200).json(populatedReview);

    } catch (err) {
        console.error('Error updating review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};


// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner or Admin)
exports.deleteReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const userRole = req.user.role;

     if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Authorization: Allow Admin OR the user who wrote the review
        if (review.user.toString() !== userId && userRole !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to delete this review' });
        }

        // Use .remove() to trigger the 'remove' middleware hooks for recalculation
        await review.remove();

        res.status(200).json({ success: true, msg: 'Review deleted successfully' });

    } catch (err) {
         console.error('Error deleting review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Like a review
// @route   POST /api/reviews/:reviewId/like
// @access  Private
exports.likeReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Remove from dislikes if present, then add to likes if not already present
        await Review.updateOne(
            { _id: reviewId },
            { 
                $pull: { dislikes: userId },
                $addToSet: { likes: userId } // $addToSet prevents duplicates
            }
        );

        const updatedReview = await Review.findById(reviewId);
        res.status(200).json({ likes: updatedReview.likes.length, dislikes: updatedReview.dislikes.length });

    } catch (err) {
        console.error('Error liking review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Dislike a review
// @route   POST /api/reviews/:reviewId/dislike
// @access  Private
exports.dislikeReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Remove from likes if present, then add to dislikes if not already present
        await Review.updateOne(
            { _id: reviewId },
            { 
                $pull: { likes: userId },
                $addToSet: { dislikes: userId }
            }
        );

        const updatedReview = await Review.findById(reviewId);
        res.status(200).json({ likes: updatedReview.likes.length, dislikes: updatedReview.dislikes.length });

    } catch (err) {
        console.error('Error disliking review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Private
exports.reportReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Check if user has already reported this review
        const hasReported = review.reports.some(report => report.user.toString() === userId);
        if (hasReported) {
            return res.status(400).json({ msg: 'You have already reported this review.' });
        }

        // Add the new report
        review.reports.push({ user: userId, reason: reason, status: 'pending' });
        await review.save();

        res.status(200).json({ msg: 'Review reported successfully. Our team will look into it.' });

    } catch (err) {
        console.error('Error reporting review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};