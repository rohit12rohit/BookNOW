// server/controllers/movieController.js
// Purpose: Handles Movie CRUD operations and review eligibility.

const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper: Escape regex special characters
const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// @desc    Check if current user can review a movie
// @route   GET /api/movies/:movieId/review-eligibility
// @access  Private
exports.checkReviewEligibility = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Check existing review
        const existingReview = await Review.exists({ movie: movieId, user: userId });
        if (existingReview) {
            return res.status(200).json({ isEligible: false, reason: 'already_reviewed' });
        }

        // 2. Check for VERIFIED booking (Confirmed/CheckedIn)
        // Optimization: Find bookings directly via deep query if possible, or two-step
        const showtimes = await Showtime.find({ movie: movieId }).select('_id');
        const showtimeIds = showtimes.map(s => s._id);

        if (showtimeIds.length === 0) {
            return res.status(200).json({ isEligible: false, reason: 'no_booking' });
        }

        const hasBooking = await Booking.exists({
            user: userId,
            showtime: { $in: showtimeIds },
            status: { $in: ['Confirmed', 'CheckedIn'] }
        });

        if (!hasBooking) {
            return res.status(200).json({ isEligible: false, reason: 'no_booking' });
        }

        res.status(200).json({ isEligible: true });

    } catch (err) {
        console.error('Eligibility Check Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get all movies (Filtered & Sorted)
// @route   GET /api/movies
// @access  Public
exports.getMovies = async (req, res) => {
    try {
        const { status, genre, language, sort, page = 1, limit = 12 } = req.query;
        const query = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filters
        if (status === 'now_showing') {
            query.releaseDate = { $lte: today };
        } else if (status === 'coming_soon') {
            query.releaseDate = { $gt: today };
        }

        if (genre) {
            query.genre = { $regex: new RegExp(`^${escapeRegex(genre)}$`, 'i') };
        }

        if (language) {
             query.movieLanguage = { $regex: new RegExp(`^${escapeRegex(language)}$`, 'i') };
        }

        // Sorting
        let sortOptions = { releaseDate: -1 }; // Default: Newest first
        if (sort === 'rating_desc') sortOptions = { averageRating: -1, releaseDate: -1 };
        else if (sort === 'rating_asc') sortOptions = { averageRating: 1, releaseDate: -1 };
        else if (sort === 'title_asc') sortOptions = { title: 1 };

        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const startIndex = (pageNum - 1) * limitNum;
        
        const total = await Movie.countDocuments(query);
        const movies = await Movie.find(query)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limitNum)
            .select('-addedBy -__v');

        const pagination = {
            current: pageNum,
            total: Math.ceil(total / limitNum),
            next: (startIndex + limitNum < total) ? { page: pageNum + 1 } : null,
            prev: (startIndex > 0) ? { page: pageNum - 1 } : null
        };

        res.status(200).json({ success: true, count: movies.length, total, pagination, data: movies });

    } catch (err) {
        console.error('Get Movies Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get Single Movie
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ msg: 'Movie not found' });
        res.status(200).json(movie);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Create Movie
// @route   POST /api/movies
// @access  Private (Admin / Approved Organizer)
exports.createMovie = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        // Validation: Check for duplicates
        const existing = await Movie.exists({ title: req.body.title });
        if (existing) {
            return res.status(400).json({ errors: [{ msg: 'Movie with this title already exists' }] });
        }

        // Create
        const movie = await Movie.create({
            ...req.body,
            addedBy: req.user.id
        });

        res.status(201).json(movie);

    } catch (err) {
        console.error('Create Movie Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update Movie
// @route   PUT /api/movies/:id
// @access  Private (Admin / Owner)
exports.updateMovie = async (req, res) => {
    try {
        let movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ msg: 'Movie not found' });

        // Authorization
        if (movie.addedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to update this movie' });
        }

        movie = await Movie.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );

        res.status(200).json(movie);
    } catch (err) {
        console.error('Update Movie Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete Movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin Only)
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ msg: 'Movie not found' });

        // DATA INTEGRITY CHECK: 
        // Do not delete movie if there are upcoming showtimes
        const activeShowtimes = await Showtime.exists({ 
            movie: req.params.id,
            startTime: { $gte: new Date() } 
        });

        if (activeShowtimes) {
            return res.status(400).json({ 
                msg: 'Cannot delete movie. There are active showtimes scheduled for it.' 
            });
        }

        await movie.remove();
        res.status(200).json({ msg: 'Movie deleted successfully' });

    } catch (err) {
        console.error('Delete Movie Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};