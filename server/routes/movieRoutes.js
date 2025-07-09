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
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin, isOrganizerOrAdmin } = require('../middleware/roleMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const movieValidationRules = [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('releaseDate', 'Release date is required').isISO8601().toDate(),
    check('duration', 'Duration must be a positive number').isInt({ gt: 0 }),
    check('movieLanguage', 'Language is required').not().isEmpty().trim(),
    check('genre', 'Genre is required and must be an array').isArray().notEmpty(),
    check('genre.*', 'Each genre must be a non-empty string').not().isEmpty().trim(),
    check('posterUrl', 'Invalid Poster URL').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid URL for the poster.'),
    check('trailerUrl', 'Invalid Trailer URL').optional({ checkFalsy: true }).isURL().withMessage('Please enter a valid URL for the trailer (YouTube links are supported).'),
    check('censorRating', 'Censor rating is required').not().isEmpty().trim(),
    check('format', 'Format is required and must be an array').isArray().notEmpty(),
    check('format.*', 'Each format must be a non-empty string').not().isEmpty().trim(),
];


// --- Public Routes ---
router.get('/', getMovies);
router.get('/:id', getMovieById);


// --- Protected Routes ---
router.post(
    '/',
    authMiddleware,
    isOrganizerOrAdmin,
    movieValidationRules,
    createMovie
);

router.put(
    '/:id',
    authMiddleware,
    isOrganizerOrAdmin,
    movieValidationRules,
    updateMovie
);

router.delete(
    '/:id',
    authMiddleware,
    isAdmin,
    deleteMovie
);


module.exports = router;