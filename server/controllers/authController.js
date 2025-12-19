// server/controllers/authController.js
// Purpose: Handles authentication with OTP verification and Google OAuth.

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

// --- Helper: Generate JWT ---
const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id,
            role: user.role
        }
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
};

// --- Helper: Generate 6-digit OTP ---
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Helper: Send OTP Email ---
const sendOTPEmail = async (email, otp, type = 'Login') => {
    const subject = `${type} Verification OTP - BookNOW`;
    const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${type} Verification</h2>
            <p>Your One-Time Password (OTP) is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
    await sendEmail({ to: email, subject, html: message, text: `Your OTP is ${otp}` });
};

// --- 1. Register User (Step 1: Save User & Send OTP) ---
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, organizationName } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ errors: [{ msg: 'User already exists' }] });

        const finalRole = (role === 'organizer') ? 'organizer' : 'user';
        const isApproved = (finalRole === 'user'); 

        // Generate OTP
        const otp = generateOTP();
        const otpExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes
        
        // Hash OTP before saving (Optional security measure, storing plain for simplicity in this demo)
        // Ideally, hash it. Here we store plain for direct comparison logic.
        
        user = new User({
            name,
            email: email.toLowerCase(),
            password, // Hashed by pre-save hook
            role: finalRole,
            isApproved,
            organizationName: finalRole === 'organizer' ? organizationName : undefined,
            isEmailVerified: false,
            otp: otp,
            otpExpire: otpExpire
        });

        await user.save();
        await sendOTPEmail(user.email, otp, 'Signup');

        res.status(201).json({ 
            success: true, 
            msg: 'Registration successful. OTP sent to your email.',
            email: user.email,
            step: 'otp' 
        });

    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({ errors: [{ msg: 'Server error during registration' }] });
    }
};

// --- 2. Verify Signup OTP (Step 2: Verify & Token) ---
exports.verifySignupOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpire');
        if (!user) return res.status(400).json({ msg: 'User not found' });

        if (user.isEmailVerified) return res.status(400).json({ msg: 'Email already verified. Please login.' });

        if (user.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
        if (user.otpExpire < Date.now()) return res.status(400).json({ msg: 'OTP Expired' });

        // Verify User
        user.isEmailVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        const token = generateToken(user);
        res.status(200).json({ token, role: user.role, isApproved: user.isApproved });

    } catch (err) {
        console.error('OTP Verification Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- 3. Login User (Step 1: Validate Creds & Send OTP) ---
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });

        if (user.role === 'organizer' && !user.isApproved) {
            return res.status(403).json({ errors: [{ msg: 'Organizer account pending approval' }] });
        }

        // Generate OTP
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendOTPEmail(user.email, otp, 'Login');

        res.status(200).json({ 
            success: true, 
            msg: 'OTP sent to your email.', 
            email: user.email,
            step: 'otp' 
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ errors: [{ msg: 'Server error during login' }] });
    }
};

// --- 4. Verify Login OTP (Step 2: Verify & Token) ---
exports.verifyLoginOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpire');
        if (!user) return res.status(400).json({ msg: 'User not found' });

        if (user.otp !== otp) return res.status(400).json({ msg: 'Invalid OTP' });
        if (user.otpExpire < Date.now()) return res.status(400).json({ msg: 'OTP Expired' });

        // Clear OTP
        user.otp = undefined;
        user.otpExpire = undefined;
        // Ensure verified flag is true if they verify via login
        if (!user.isEmailVerified) user.isEmailVerified = true; 
        
        await user.save();

        const token = generateToken(user);
        res.status(200).json({ token, role: user.role });

    } catch (err) {
        console.error('Login OTP Error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// --- 5. Google Callback ---
exports.googleCallback = (req, res) => {
    // Generate token
    const token = generateToken(req.user);
    
    // Redirect to a dedicated SUCCESS page on frontend instead of home
    // This allows you to show a "Logging in..." or "Select Role" screen
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/google-auth-success?token=${token}`);
};

// --- Standard Auth Controllers (GetMe, ForgotPassword, etc.) ---
// ... (Keep existing getMe, forgotPassword, resetPassword as they were in previous file)
exports.getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) return res.status(401).json({ msg: 'Not authorized' });
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.forgotPassword = async (req, res) => {
    // (Copy existing logic from previous response)
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(200).json({ success: true, data: 'Email sent if user exists.' });

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;
        const message = `<p>Reset link: <a href="${resetUrl}">${resetUrl}</a></p>`;

        await sendEmail({ to: user.email, subject: 'Password Reset', html: message });
        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        res.status(500).json({ msg: 'Error sending email' });
    }
};

exports.resetPassword = async (req, res) => {
    // (Copy existing logic from previous response)
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
        const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) return res.status(400).json({ msg: 'Invalid token' });

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ success: true, msg: 'Password reset successful' });
    } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};