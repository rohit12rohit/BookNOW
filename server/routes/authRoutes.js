// server/routes/authRoutes.js
// Purpose: Defines the API routes related to authentication (register, login, get profile).

const express = require('express');
const passport = require('passport');
const { registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
    googleCallback
} = require('../controllers/authController');
const { check } = require('express-validator'); // Import check function for validation
const authMiddleware = require('../middleware/authMiddleware'); // Import auth middleware for protected routes

const router = express.Router();

// --- Validation Rules ---
// Define reusable validation rules arrays
const registerValidationRules = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Invalid role specified').optional().isIn(['user', 'organizer']), // Validate role if provided
    check('organizationName', 'Organization name is required for organizers')
        .if(check('role').equals('organizer')) // Only required if role is organizer
        .not().isEmpty().trim().escape(),
];

const loginValidationRules = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists() // Check if password field is present
];

const forgotPasswordValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];
// --- Route Definitions ---

// @route   POST /api/auth/register
// @desc    Register a new user or organizer
// @access  Public
router.post('/register', registerValidationRules, registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidationRules, loginUser);

// @route   GET /api/auth/me
// @desc    Get current logged-in user's profile
// @access  Private (Requires valid token)
router.get('/me', authMiddleware, getMe); // Apply authMiddleware before the controller

// @route   POST /api/auth/forgotpassword   // << NEW ROUTE
// @desc    Request password reset (sends email/token)
// @access  Public
router.post('/forgotpassword', forgotPasswordValidation, forgotPassword);

// @route   PUT /api/auth/resetpassword/:resettoken  // << NEW ROUTE
// @desc    Reset password using token from email
// @access  Public
router.put('/resetpassword/:resettoken', resetPasswordValidation, resetPassword);

// @route   GET /api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// @route   GET /api/auth/google/callback
// @desc    Callback for Google to redirect to
// @access  Public
router.get('/google/callback', passport.authenticate('google'), googleCallback);

module.exports = router;