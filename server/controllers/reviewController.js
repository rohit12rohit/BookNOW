// server/controllers/reviewController.js
// Contains logic for all review-related API requests.

const Review = require('../models/Review');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// @desc    Get all reviews for a specific movie
// @route   GET /api/movies/:movieId/reviews
// @access  Public
exports.getReviewsForMovie = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.movieId)) {
            return res.status(400).json({ msg: 'Invalid Movie ID format' });
        }

        const reviews = await Review.find({ movie: req.params.movieId })
            // --- THIS LINE IS THE FIX ---
            // It tells the database to find the user associated with the review
            // and include their 'name' in the response.
            .populate('user', 'name') 
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
    try {
        const reviews = await Review.find({ user: req.user.id }).populate('movie', 'title posterUrl').sort({ createdAt: -1 });
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
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { rating, comment } = req.body;
    const { movieId } = req.params;
    const userId = req.user.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(movieId)) return res.status(400).json({ msg: 'Invalid Movie ID' });
        
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ msg: 'Movie not found' });

        const existingReview = await Review.findOne({ movie: movieId, user: userId });
        if (existingReview) return res.status(400).json({ msg: 'You have already reviewed this movie' });

        const showtimesForMovie = await Showtime.find({ movie: movieId }).distinct('_id');
        if (showtimesForMovie.length === 0) return res.status(400).json({ msg: 'Could not verify booking status for this movie.' });
        
        const userBooking = await Booking.findOne({
            user: userId,
            showtime: { $in: showtimesForMovie },
            status: { $in: ['Confirmed', 'CheckedIn'] }
        });

        if (!userBooking) return res.status(403).json({ msg: 'You must have a confirmed ticket for this movie to write a review.' });
        
        const review = await Review.create({ rating, comment, user: userId, movie: movieId });
        const populatedReview = await Review.findById(review._id).populate('user', 'name');
        res.status(201).json(populatedReview);
    } catch (err) {
        console.error('Error creating review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update a review written by the user
// @route   PUT /api/reviews/:reviewId
// @access  Private
exports.updateReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { rating, comment } = req.body;
    const { reviewId } = req.params;

    try {
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ msg: 'Review not found' });
        if (review.user.toString() !== req.user.id) return res.status(403).json({ msg: 'User not authorized to update this review' });

        if (rating !== undefined) review.rating = rating;
        if (comment !== undefined) review.comment = comment;
        
        await review.save();
        const populatedReview = await Review.findById(review._id).populate('user', 'name');
        res.status(200).json(populatedReview);
    } catch (err) {
        console.error('Error updating review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner, Admin, or Organizer)
exports.deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ msg: 'Invalid Review ID format' });
        }

        // Step 1: Find the review to perform authorization checks
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Step 2: Check if the user is authorized to delete
        const allowedRoles = ['admin', 'organizer'];
        if (review.user.toString() !== req.user.id && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'User not authorized to delete this review' });
        }
        
        // Step 3: Delete the review using the modern findByIdAndDelete method
        // The post('findOneAndDelete') hook in the model will handle rating recalculation.
        await Review.findByIdAndDelete(reviewId);
        
        res.status(200).json({ success: true, msg: 'Review removed successfully' });
    } catch (err) {
        console.error('Error deleting review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Like or unlike a review
// @route   PUT /api/reviews/:reviewId/like
// @access  Private
exports.likeReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ msg: 'Review not found' });

        review.dislikes.pull(req.user.id);
        const likesIndex = review.likes.indexOf(req.user.id);
        if (likesIndex > -1) {
            review.likes.splice(likesIndex, 1);
        } else {
            review.likes.push(req.user.id);
        }
        
        await review.save();
        res.json(review);
    } catch (err) {
        console.error('Error liking review:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Dislike or un-dislike a review
// @route   PUT /api/reviews/:reviewId/dislike
// @access  Private
exports.dislikeReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ msg: 'Review not found' });

        review.likes.pull(req.user.id);
        const dislikesIndex = review.dislikes.indexOf(req.user.id);
        if (dislikesIndex > -1) {
            review.dislikes.splice(dislikesIndex, 1);
        } else {
            review.dislikes.push(req.user.id);
        }
        
        await review.save();
        res.json(review);
    } catch (err) {
        console.error('Error disliking review:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Private
exports.reportReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { reason } = req.body;
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ msg: 'Review not found' });

        if (review.reports.some(report => report.user.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'You have already reported this review.' });
        }
        
        review.reports.push({ user: req.user.id, reason });
        await review.save();
        res.json({ msg: 'Review reported successfully.' });
    } catch (err) {
        console.error('Error reporting review:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};