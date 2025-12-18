// server/controllers/movieController.js
// Purpose: Contains logic for handling movie-related API requests (CRUD operations).

const Movie = require('../models/Movie');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Review = require('../models/Review'); // Needed for eligibility check
const Booking = require('../models/Booking'); // Needed for eligibility check
const Showtime = require('../models/Showtime'); // Needed for eligibility check

// @desc    Check if the current user is eligible to review a movie
// @route   GET /api/movies/:movieId/review-eligibility
// @access  Private
exports.checkReviewEligibility = async (req, res) => {
    const { movieId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Check if the user has already reviewed this movie
        const existingReview = await Review.findOne({ movie: movieId, user: userId });
        if (existingReview) {
            return res.status(200).json({ isEligible: false, reason: 'already_reviewed' });
        }

        // 2. **FIXED LOGIC**: Check if the user has a 'Confirmed' or 'CheckedIn' booking for ANY showtime of this movie.
        // The incorrect condition `startTime: { $lt: new Date() }` has been removed.
        const showtimeIds = await Showtime.find({ movie: movieId }).distinct('_id');
        
        if (showtimeIds.length === 0) {
            return res.status(200).json({ isEligible: false, reason: 'no_booking' });
        }

        const userBooking = await Booking.findOne({
            user: userId,
            showtime: { $in: showtimeIds },
            status: { $in: ['Confirmed', 'CheckedIn'] }
        });

        if (!userBooking) {
            return res.status(200).json({ isEligible: false, reason: 'no_booking' });
        }

        // If all checks pass, the user is eligible
        res.status(200).json({ isEligible: true });

    } catch (err) {
        console.error('Error checking review eligibility:', err.message);
        res.status(500).json({ msg: 'Server error while checking eligibility' });
    }
};
// @desc    Get all movies (with filtering and sorting)
// @route   GET /api/movies?status=now_showing&genre=Action&language=English&sort=rating_desc&limit=10&page=1
// @access  Public
exports.getMovies = async (req, res) => {
    try {
        const query = {};
        const { status, genre, language, sort, page, limit } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // --- Filtering ---
        if (status === 'now_showing') {
            query.releaseDate = { $lte: today };
        } else if (status === 'coming_soon') {
            query.releaseDate = { $gt: today };
        }

        if (genre) {
            query.genre = { $regex: new RegExp(`^${genre}$`, 'i') };
        }

        // Standardize on 'language' as the query parameter
        if (language) {
             query.movieLanguage = { $regex: new RegExp(`^${language}$`, 'i') };
        }

        // --- Sorting ---
        let sortOptions = { releaseDate: -1 };
        if (sort) {
             switch (sort) {
                case 'rating_desc': sortOptions = { averageRating: -1, releaseDate: -1 }; break;
                case 'rating_asc': sortOptions = { averageRating: 1, releaseDate: -1 }; break;
                case 'releaseDate_asc': sortOptions = { releaseDate: 1 }; break;
                case 'title_asc': sortOptions = { title: 1 }; break;
                case 'title_desc': sortOptions = { title: -1 }; break;
             }
        }

        // --- Pagination ---
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = pageNum * limitNum;
        const total = await Movie.countDocuments(query);

        const movies = await Movie.find(query)
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limitNum)
            .select('-addedBy -__v');

        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: pageNum + 1, limit: limitNum };
        }
        if (startIndex > 0) {
            pagination.prev = { page: pageNum - 1, limit: limitNum };
        }

        res.status(200).json({ success: true, count: movies.length, total, pagination, data: movies });

    } catch (err) {
        console.error('Error fetching movies:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get a single movie by ID
// @route   GET /api/movies/:id
// @access  Public
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }
        res.status(200).json(movie);
    } catch (err) {
        console.error('Error fetching movie by ID:', err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Create a new movie
// @route   POST /api/movies
// @access  Private (Admin or Approved Organizer)
exports.createMovie = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title, description, releaseDate, duration, movieLanguage,
        genre, cast, crew, posterUrl, trailerUrl, censorRating, format
    } = req.body;

    try {
        let existingMovie = await Movie.findOne({ title });
        if (existingMovie) {
            return res.status(400).json({ errors: [{ msg: 'Movie with this title already exists' }] });
        }
        
        if (req.user.role === 'organizer') {
             const organizer = await User.findById(req.user.id);
             if (!organizer?.isApproved) {
                 return res.status(403).json({ msg: 'Organizer account not approved to add movies.' });
             }
        }

        const movieData = {
            title, description, releaseDate, duration,
            movieLanguage, genre, cast, crew, posterUrl, trailerUrl, censorRating, format,
            addedBy: req.user.id
        };

        const movie = await Movie.create(movieData);
        res.status(201).json(movie);

    } catch (err) {
         console.error('[createMovie] Error during creation:', err.message);
         if (err.code === 11000) {
             return res.status(400).json({ errors: [{ msg: 'Movie with this title already exists.' }] });
         }
         if (err.name === 'ValidationError') {
             let errorMessages = Object.values(err.errors).map(e => e.message);
              return res.status(400).json({ msg: `Movie validation failed: ${errorMessages.join(', ')}` });
         }
        res.status(500).json({ msg: `Server error: ${err.message}` });
    }
};

// @desc    Update an existing movie
// @route   PUT /api/movies/:id
// @access  Private (Admin or Approved Organizer)
exports.updateMovie = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        if (movie.addedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'User not authorized to update this movie' });
        }

        movie = await Movie.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json(movie);
    } catch (err) {
        console.error('Error updating movie:', err.message);
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private (Admin Only)
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ msg: 'Movie not found' });
        }

        // TODO: Add logic to check if the movie is in any active showtimes before deleting.
        // For now, proceeding with deletion.

        await movie.remove();
        res.status(200).json({ msg: 'Movie removed successfully' });

    } catch (err) {
        console.error('Error deleting movie:', err.message);
         if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Movie not found (Invalid ID format)' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};