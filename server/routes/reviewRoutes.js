// File: /server/routes/reviewRoutes.js
// Purpose: Defines API routes related to reviews.

const express = require('express');
const {
    getReviewsForMovie,
    getMyReviews,
    createReview,
    updateReview,
    deleteReview,
    likeReview,
    dislikeReview,
    reportReview
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

const reportValidation = [
    check('reason', 'A reason for reporting is required').not().isEmpty().trim().escape()
];

// --- Route Definitions ---

// These routes are nested under movies: /api/movies/:movieId/reviews
router.route('/')
    .get(getReviewsForMovie)    // GET /api/movies/:movieId/reviews
    .post(                      // POST /api/movies/:movieId/reviews
        authMiddleware,         // 1. Must be logged in
        reviewValidation,       // 2. Validate input
        createReview            // 3. Execute create logic (includes booking check)
     );


// Standalone routes for managing reviews by ID or getting user's own reviews
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
    authMiddleware,
    reviewValidation,
    updateReview
);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete own review (or any review if admin)
// @access  Private
standaloneRouter.delete(
    '/:reviewId',
    authMiddleware,
    deleteReview
);

// @route   POST /api/reviews/:reviewId/like
// @desc    Like a review
// @access  Private
standaloneRouter.post('/:reviewId/like', authMiddleware, likeReview);

// @route   POST /api/reviews/:reviewId/dislike
// @desc    Dislike a review
// @access  Private
standaloneRouter.post('/:reviewId/dislike', authMiddleware, dislikeReview);

// @route   POST /api/reviews/:reviewId/report
// @desc    Report a review
// @access  Private
standaloneRouter.post('/:reviewId/report', authMiddleware, reportValidation, reportReview);


// Export both routers - nested for movie context, standalone for direct review management
module.exports = { movieReviewRouter: router, reviewManagementRouter: standaloneRouter };