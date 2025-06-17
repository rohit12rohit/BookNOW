// server/routes/movieRoutes.js
// Purpose: Defines API routes related to movies.

const express = require('express');
const {
    getMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie
} = require('../controllers/movieController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to check authentication token
const { isAdmin, isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); // Middleware for role checks
const { check } = require('express-validator'); // For route-level validation

const router = express.Router();
// console.log('[DEBUG] typeof createMovie:', typeof createMovie);
// console.log('[DEBUG] typeof authMiddleware:', typeof authMiddleware);
// console.log('[DEBUG] typeof isOrganizerOrAdmin:', typeof isOrganizerOrAdmin);
// --- Validation Rules --- (Example for create/update)
const movieValidationRules = [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('releaseDate', 'Release date is required').isISO8601().toDate(), // Check for valid date format
    check('duration', 'Duration must be a positive number').isInt({ gt: 0 }),
    check('movieLanguage', 'Language is required').not().isEmpty().trim(),
    check('genre', 'Genre is required and must be an array').isArray().notEmpty(),
    check('genre.*', 'Each genre must be a non-empty string').not().isEmpty().trim(), // Validate each item in the array
    check('posterUrl', 'Invalid Poster URL').optional({ checkFalsy: true }).isURL(),
    check('trailerUrl', 'Invalid Trailer URL').optional({ checkFalsy: true }).isURL(),
];


// --- Public Routes ---

// @route   GET /api/movies
// @desc    Get all movies
// @access  Public
router.get('/', getMovies);

// @route   GET /api/movies/:id
// @desc    Get a single movie by ID
// @access  Public
router.get('/:id', getMovieById);


// --- Protected Routes ---

// @route   POST /api/movies
// @desc    Create a new movie
// @access  Private (Admin or Organizer)
router.post(
    '/',
    authMiddleware,         // 1. Check if user is logged in
    isOrganizerOrAdmin,     // 2. Check if user has appropriate role
    movieValidationRules,   // 3. Validate input data
    createMovie             // 4. Execute controller logic
);

// @route   PUT /api/movies/:id
// @desc    Update a movie
// @access  Private (Admin or Organizer)
router.put(
    '/:id',
    authMiddleware,
    isOrganizerOrAdmin,
    movieValidationRules, // Apply validation rules on update too
    updateMovie
);

// @route   DELETE /api/movies/:id
// @desc    Delete a movie
// @access  Private (Admin Only)
router.delete(
    '/:id',
    authMiddleware,         // 1. Check login
    isAdmin,                // 2. Check if user is Admin
    deleteMovie             // 3. Execute controller
);


module.exports = router;