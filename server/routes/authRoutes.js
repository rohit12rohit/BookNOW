// server/routes/authRoutes.js
const express = require('express');
const { registerUser, loginUser, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidationRules = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Invalid role').optional().isIn(['user', 'organizer']),
    check('organizationName', 'Organization name is required for organizers').if(check('role').equals('organizer')).not().isEmpty().trim().escape(),
];

const loginValidationRules = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
];

const forgotPasswordValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
];

const resetPasswordValidation = [
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

router.post('/register', registerValidationRules, registerUser);
router.post('/login', loginValidationRules, loginUser);
router.get('/me', authMiddleware, getMe);
router.post('/forgotpassword', forgotPasswordValidation, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, resetPassword);

module.exports = router;