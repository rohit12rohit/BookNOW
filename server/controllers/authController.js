// server/controllers/authController.js
// Purpose: Contains the logic for handling authentication-related requests.

// --- Required Modules ---
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

// --- Helper Function to Generate JWT ---
const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id,
            role: user.role
        }
    };
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '5h' }
    );
};

// --- Register User Controller ---
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, organizationName } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User with this email already exists' }] });
        }

        const finalRole = (role === 'organizer') ? 'organizer' : 'user';
        const isApproved = (finalRole === 'user'); // Organizers need manual approval

        user = new User({
            name,
            email: email.toLowerCase(),
            password, // Passed as plain text; User model pre-save hook will hash it
            role: finalRole,
            isApproved: isApproved,
            organizationName: finalRole === 'organizer' ? organizationName : undefined
        });

        await user.save(); // Triggers the pre-save hook in User.js

        const token = generateToken(user);
        res.status(201).json({ token, role: user.role, isApproved: user.isApproved });

    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error during registration' }] });
    }
};

// --- Login User Controller ---
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        // Explicitly select password since it is set to select: false in schema
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        // Use the instance method defined in User model
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        if (user.role === 'organizer' && !user.isApproved) {
            return res.status(403).json({ errors: [{ msg: 'Organizer account pending approval' }] });
        }

        const token = generateToken(user);
        res.status(200).json({ token, role: user.role });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error during login' }] });
    }
};

// --- Get Logged-in User Controller ---
exports.getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
             return res.status(401).json({ msg: 'Not authorized, user context missing' });
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        console.error('GetMe Error:', err.message);
        res.status(500).json({ msg: 'Server error fetching user profile' });
    }
};

// --- Google Auth Callback Controller ---
exports.googleCallback = (req, res) => {
    // Security Note: Passing token in URL is a risk. 
    // Ideally, send a temporary code or use a cookie-based exchange.
    // For now, ensuring HTTPS on the frontend is critical.
    const token = generateToken(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?token=${token}`);
};

// --- Forgot Password Controller ---
exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return res.status(200).json({ success: true, data: 'If an account exists, a reset email has been sent.' });
        }

        // Generate plain token (hashing happens in the method)
        const resetToken = user.getResetPasswordToken();
        
        // Save user to store the hashed token and expiry
        await user.save({ validateBeforeSave: false });

        // Construct the full reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

        // Construct email message
        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your BookNOW account.</p>
            <p>Please click on the following link to reset your password (valid for 10 minutes):</p>
            <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                to: user.email,
                subject: 'BookNOW - Password Reset Request',
                html: message,
                text: `Please use this link to reset your password: ${resetUrl}`
            });

            res.status(200).json({ success: true, data: 'Email sent' });

        } catch (emailError) {
            console.error('Email sending error:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ msg: 'Email could not be sent. Please try again.' });
        }

    } catch (err) {
        console.error('Forgot Password Error:', err.message);
        res.status(500).json({ msg: 'Server error processing request' });
    }
};

// --- Reset Password Controller ---
exports.resetPassword = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        // Hash the incoming plain token to compare with storage
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        // Set new password (plain text)
        user.password = req.body.password;

        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Save: This triggers the pre-save hook in User.js which HASHES the password
        await user.save(); 

        res.status(200).json({ success: true, msg: 'Password reset successful' });

    } catch (err) {
         console.error('Reset Password Error:', err.message);
         res.status(500).json({ msg: 'Server error' });
    }
};