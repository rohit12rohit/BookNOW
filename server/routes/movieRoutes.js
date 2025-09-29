// File: /server/routes/movieRoutes.js
const express = require('express');
const {
    getMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie,
    checkReviewEligibility // Import new controller
} = require('../controllers/movieController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isOrganizerOrAdmin } = require('../middleware/roleMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const movieValidationRules = [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('releaseDate', 'Release date is required').isISO8601().toDate(),
    check('duration', 'Duration must be a positive number').isInt({ gt: 0 }),
    check('movieLanguage', 'Language is required').not().isEmpty().trim(),
    check('genre', 'Genre is required and must be an array').isArray().notEmpty(),
    check('genre.*', 'Each genre must be a non-empty string').not().isEmpty().trim(),
    check('posterUrl', 'Invalid Poster URL').optional({ checkFalsy: true }).isURL(),
    check('trailerUrl', 'Invalid Trailer URL').optional({ checkFalsy: true }).isURL(),
];

// Public Routes
router.get('/', getMovies);
router.get('/:id', getMovieById);

// Protected Routes
router.post('/', authMiddleware, isOrganizerOrAdmin, movieValidationRules, createMovie);
router.put('/:id', authMiddleware, isOrganizerOrAdmin, movieValidationRules, updateMovie);
router.delete('/:id', authMiddleware, isAdmin, deleteMovie);

// New Protected Route for Review Eligibility
router.get('/:id/review-eligibility', authMiddleware, checkReviewEligibility);

module.exports = router;