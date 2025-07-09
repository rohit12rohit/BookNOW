// server/routes/reviewRoutes.js
// Purpose: Defines API routes related to reviews.

const express = require('express');
const {
    getReviewsForMovie, // Note: This endpoint might logically be grouped under movie routes too
    getMyReviews,
    createReview,      // Note: This endpoint might logically be grouped under movie routes too
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware'); // Only needed if admins have special permissions beyond owners
const { check } = require('express-validator');

const router = express.Router({ mergeParams: true }); // !! Important: mergeParams allows access to :movieId from parent router !!

// --- Validation Rules ---
const reviewValidation = [
    check('rating', 'Rating is required and must be a number between 1 and 5').isFloat({ min: 1, max: 5 }),
    check('comment').optional().trim().escape().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];

// --- Route Definitions ---

// These routes are nested under movies: /api/movies/:movieId/reviews
// We'll need to mount this router correctly in server.js or movieRoutes.js later
router.route('/')
    .get(getReviewsForMovie)    // GET /api/movies/:movieId/reviews
    .post(                      // POST /api/movies/:movieId/reviews
        authMiddleware,         // 1. Must be logged in
        reviewValidation,       // 2. Validate input
        createReview            // 3. Execute create logic (includes booking check)
     );


// Standalone routes for managing reviews by ID or getting user's own reviews
// We'll mount this part under /api/reviews

const standaloneRouter = express.Router();

// @route   GET /api/reviews/me
// @desc    Get reviews written by logged-in user
// @access  Private
standaloneRouter.get('/me', authMiddleware, getMyReviews);


// @route   PUT /api/reviews/:reviewId
// @desc    Update own review
// @access  Private
standaloneRouter.put(
    '/:reviewId',
    authMiddleware, // 1. Must be logged in (controller checks ownership)
    reviewValidation, // 2. Validate input
    updateReview    // 3. Execute update logic
);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete own review (or any review if admin)
// @access  Private
standaloneRouter.delete(
    '/:reviewId',
    authMiddleware, // 1. Must be logged in (controller checks ownership/admin role)
    deleteReview    // 2. Execute delete logic
);


// Export both routers - nested for movie context, standalone for direct review management
module.exports = { movieReviewRouter: router, reviewManagementRouter: standaloneRouter };