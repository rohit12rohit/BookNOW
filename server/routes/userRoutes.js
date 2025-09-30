// server/routes/userRoutes.js
const express = require('express');
const { updateMyProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// Validation for updating profile
const profileUpdateValidation = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
];

// @route   PUT /api/users/profile
// @desc    Update current logged-in user's profile
// @access  Private
router.put(
    '/profile',
    authMiddleware,
    profileUpdateValidation,
    updateMyProfile
);

module.exports = router;