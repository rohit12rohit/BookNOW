
// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    updatePassword 
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// --- Validation Rules ---
const profileUpdateValidation = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
];

const passwordUpdateValidation = [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

// --- Routes ---

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authMiddleware, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update profile details (Name, Email)
// @access  Private
router.put(
    '/profile',
    authMiddleware,
    profileUpdateValidation,
    updateUserProfile // FIXED: Matches the export in userController.js
);

// @route   PUT /api/users/update-password
// @desc    Update password
// @access  Private
router.put(
    '/update-password',
    authMiddleware,
    passwordUpdateValidation,
    updatePassword
);

module.exports = router;