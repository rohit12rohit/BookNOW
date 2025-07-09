// // // server/controllers/authController.js
// // // Purpose: Contains the logic for handling authentication-related requests.

// // // --- Required Modules ---
// // const User = require('../models/User');
// // const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken');
// // const crypto = require('crypto'); // For password reset token
// // const { validationResult } = require('express-validator');
// // const sendEmail = require('../utils/sendEmail'); // For sending emails
// // const sendSms = require('../utils/sendSms'); // NEW: Import the SMS utility


// // // --- Helper Function to Generate JWT ---
// // const generateToken = (user) => {
// //     const payload = {
// //         user: {
// //             id: user.id, // User's unique MongoDB ID
// //             role: user.role // User's role
// //         }
// //     };
// //     // Sign token with secret from .env and set expiration
// //     return jwt.sign(
// //         payload,
// //         process.env.JWT_SECRET,
// //         { expiresIn: '5h' } // Example: 5-hour expiration
// //     );
// // };


// // // --- Register User Controller ---
// // exports.registerUser = async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
// //     const { name, email, password, role, organizationName } = req.body;
// //     try {
// //         let user = await User.findOne({ email: email.toLowerCase() });
// //         if (user) return res.status(400).json({ errors: [{ msg: 'User with this email already exists' }] });
// //         const finalRole = (role === 'organizer') ? 'organizer' : 'user';
// //         const isApproved = (finalRole === 'user');
// //         user = new User({ name, email: email.toLowerCase(), password, role: finalRole, isApproved: isApproved, organizationName: finalRole === 'organizer' ? organizationName : undefined });
// //         const salt = await bcrypt.genSalt(10);
// //         user.password = await bcrypt.hash(password, salt);
// //         await user.save();
// //         const token = generateToken(user);
// //         res.status(201).json({ token, role: user.role, isApproved: user.isApproved });
// //     } catch (err) { console.error('Registration Error:', err.message); res.status(500).json({ errors: [{ msg: 'Server error during registration' }] }); }
// // };


// // // --- Login User Controller ---
// // exports.loginUser = async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
// //     const { email, password } = req.body;
// //     try {
// //         const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
// //         if (!user) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
// //         const isMatch = await bcrypt.compare(password, user.password);
// //         if (!isMatch) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
// //         if (user.role === 'organizer' && !user.isApproved) return res.status(403).json({ errors: [{ msg: 'Organizer account pending approval' }] });
// //         const token = generateToken(user);
// //         res.status(200).json({ token, role: user.role });
// //     } catch (err) { console.error('Login Error:', err.message); res.status(500).json({ errors: [{ msg: 'Server error during login' }] }); }
// // };


// // // --- Get Logged-in User Controller ---
// // exports.getMe = async (req, res) => {
// //     try {
// //         // req.user should be attached by authMiddleware if token is valid
// //         if (!req.user || !req.user.id) {
// //              return res.status(401).json({ msg: 'Not authorized, user context missing' });
// //         }
// //         const user = await User.findById(req.user.id).select('-password');
// //         if (!user) return res.status(404).json({ msg: 'User not found' });
// //         res.status(200).json(user);
// //     } catch (err) { console.error('GetMe Error:', err.message); res.status(500).json({ msg: 'Server error fetching user profile' }); }
// // };


// // // --- Forgot Password Controller (with Reset Link Logging) ---
// // exports.forgotPassword = async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //         return res.status(400).json({ errors: errors.array() });
// //     }

// //     const { email } = req.body;

// //     try {
// //         const user = await User.findOne({ email: email.toLowerCase() });

// //         if (!user) {
// //             // Don't reveal if user exists
// //             console.log(`Forgot password attempt for non-existent email: ${email}`);
// //             return res.status(200).json({ success: true, data: 'Password reset email has been dispatched if an account with that email exists.' });
// //         }

// //         // Ensure the user model instance has the method defined
// //         if (typeof user.getResetPasswordToken !== 'function') {
// //              console.error(`FATAL ERROR: user.getResetPasswordToken is not a function on User model instance for ${user.email}`);
// //              return res.status(500).json({ msg: 'Server configuration error [FP01].'});
// //         }

// //         const resetToken = user.getResetPasswordToken(); // Generate plain token
// //         await user.save({ validateBeforeSave: false }); // Save hashed token & expiry to DB

// //         // Construct the full reset URL
// //         const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

// //         // --- ADDED LOG FOR TESTING ---
// //         console.log('--------------------------------------------------');
// //         console.log('--- PASSWORD RESET LINK (FOR DEV/TESTING ONLY) ---');
// //         console.log(`--- User Email: ${user.email}`);
// //         console.log(`--- Token (Plain): ${resetToken}`);
// //         console.log(`--- Full URL: ${resetUrl}`); // <<< THIS IS THE ADDED LOG
// //         console.log('--------------------------------------------------');
// //         // --- END ADDED LOG ---

// //         // Construct email message
// //         const message = `<h2>Password Reset Request</h2><p>You requested a password reset for your BookNOW account associated with ${user.email}.</p><p>Please click on the following link, or paste it into your browser to complete the process within 10 minutes:</p><p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><hr><p>Thank you,<br>The BookNOW Team</p>`;

// //         // Attempt to send the actual email
// //         try {
// //             console.log(`Attempting to send password reset email to ${user.email}...`);
// //             await sendEmail({
// //                 to: user.email,
// //                 subject: 'BookNOW - Password Reset Request',
// //                 html: message,
// //                 text: `Please use this link to reset your password: ${resetUrl}`
// //             });

// //             res.status(200).json({ success: true, data: 'Password reset email dispatched successfully.' });

// //         } catch (emailError) {
// //             console.error('Email sending error during forgot password:', emailError);
// //             // Clear token fields if email fails so user can retry
// //             user.resetPasswordToken = undefined;
// //             user.resetPasswordExpire = undefined;
// //             await user.save({ validateBeforeSave: false });
// //             return res.status(500).json({ msg: 'Email could not be sent. Please try again.' });
// //         }

// //     } catch (err) {
// //         console.error('Forgot Password Error (Outside Email):', err.message);
// //         res.status(500).json({ msg: 'Server error processing request' });
// //     }
// // };


// // // --- Reset Password Controller ---
// // exports.resetPassword = async (req, res) => {
// //      const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// //     // Hash the incoming plain token from URL param to match stored hash
// //     let resetPasswordToken;
// //     try {
// //         resetPasswordToken = crypto
// //             .createHash('sha256')
// //             .update(req.params.resettoken) // Get plain token from URL param
// //             .digest('hex');
// //     } catch (hashError) {
// //          console.error("Error hashing reset token:", hashError);
// //          return res.status(400).json({ msg: 'Invalid token format.' });
// //     }


// //     try {
// //         // Find user by the HASHED token & check expiry
// //         const user = await User.findOne({
// //             resetPasswordToken,
// //             resetPasswordExpire: { $gt: Date.now() } // Token is valid and not expired
// //         });

// //         if (!user) {
// //             return res.status(400).json({ msg: 'Invalid or expired reset token' });
// //         }

// //         // Set new password from request body
// //         user.password = req.body.password;

// //         // Clear the reset token fields
// //         user.resetPasswordToken = undefined;
// //         user.resetPasswordExpire = undefined;

// //         // Hash the new password before saving
// //          const salt = await bcrypt.genSalt(10);
// //          user.password = await bcrypt.hash(user.password, salt);

// //         // Save user with new password
// //         await user.save(); // Runs validation (e.g., password length)

// //         res.status(200).json({ success: true, msg: 'Password reset successful' });

// //     } catch (err) {
// //          console.error('Reset Password Error:', err.message);
// //          if (err.name === 'ValidationError') {
// //              return res.status(400).json({ msg: `Validation failed: ${err.message}` });
// //          }
// //          res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// // // @desc    Generate and send an OTP for mobile login
// // // @route   POST /api/auth/login/mobile/send-otp
// // // @access  Public
// // exports.sendLoginOtp = async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// //     const { mobileNumber } = req.body;
// //     try {
// //         let user = await User.findOne({ mobileNumber });

// //         if (!user) {
// //             // If user doesn't exist, create one with ONLY a mobile number and name.
// //             // No temporary email is created.
// //             user = new User({
// //                 name: `User-${mobileNumber.slice(-4)}`, // Generate a temporary name
// //                 mobileNumber: mobileNumber,
// //             });
// //         }
        
// //         const otp = await user.getOtp();
// //         await user.save();

// //         try {
// //             await sendSms({
// //                 to: user.mobileNumber,
// //                 message: `Your BookNOW login OTP is: ${otp}. It is valid for 5 minutes.`
// //             });
// //             res.status(200).json({ success: true, msg: 'OTP sent successfully.' });
// //         } catch (smsError) {
// //             console.error('SMS sending error:', smsError);
// //             user.otp = undefined;
// //             user.otpExpire = undefined;
// //             await user.save();
// //             return res.status(500).json({ msg: 'Failed to send OTP. Please try again.' });
// //         }
// //     } catch (err) {
// //         console.error('Send OTP Error:', err.message);
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// // // @desc    Verify OTP and log in the user
// // // @route   POST /api/auth/login/mobile/verify-otp
// // // @access  Public
// // exports.verifyLoginOtp = async (req, res) => {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

// //     const { mobileNumber, otp } = req.body;
// //     try {
// //         const user = await User.findOne({
// //             mobileNumber,
// //             otpExpire: { $gt: Date.now() }
// //         });

// //         if (!user || !user.otp) {
// //             return res.status(400).json({ errors: [{ msg: 'Invalid OTP or OTP has expired. Please request a new one.' }] });
// //         }
        
// //         const isMatch = await bcrypt.compare(otp, user.otp);
// //         if (!isMatch) {
// //             return res.status(400).json({ errors: [{ msg: 'Invalid OTP. Please check and try again.' }] });
// //         }
        
// //         user.otp = undefined;
// //         user.otpExpire = undefined;
// //         await user.save();

// //         const token = generateToken(user);
// //         res.status(200).json({ token, role: user.role });

// //     } catch (err) {
// //         console.error('Verify OTP Error:', err.message);
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

















// // server/controllers/authController.js
// const { OAuth2Client } = require('google-auth-library');
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');
// const sendSms = require('../utils/sendSms');
// const sendEmail = require('../utils/sendEmail');

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const generateToken = (user) => jwt.sign({ user: { id: user.id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '5h' });

// // --- All Controller Functions ---

// // 1. Check if user exists and determine next step
// exports.checkUser = async (req, res) => {
//     const { identifier } = req.body;
//     const isEmail = identifier.includes('@');
//     const query = isEmail ? { email: identifier.toLowerCase() } : { mobileNumber: identifier };
//     try {
//         const user = await User.findOne(query);
//         if (user) {
//             return res.json({ exists: true, method: isEmail ? 'password' : 'otp' });
//         }
//         return res.json({ exists: false, method: isEmail ? 'new-email-signup' : 'new-mobile-signup' });
//     } catch (err) { res.status(500).json({ msg: 'Server error' }); }
// };

// // 2. Login with Email & Password
// exports.loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
//         if (!user || !user.password) return res.status(404).json({ msg: 'User not found or registered via other methods.' });
//         if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ msg: 'Invalid credentials' });
//         const token = generateToken(user);
//         res.json({ token, user });
//     } catch (err) { res.status(500).json({ msg: 'Server error' }); }
// };

// // 3. Send OTP for Mobile Login/Signup
// exports.sendOtp = async (req, res) => {
//     const { mobileNumber } = req.body;
//     try {
//         let user = await User.findOne({ mobileNumber });

//         if (!user) { // New mobile user signup flow
//             user = await User.create({ name: `User ${mobileNumber.slice(-4)}`, mobileNumber, isVerified: false });
//         }
        
//         const otp = await user.getOtp();
//         await user.save({ validateBeforeSave: false });
        
//         // --- IMPROVED ERROR HANDLING FOR SMS ---
//         try {
//             // Note: For production, ensure the number format matches what Twilio expects (e.g., +91 for India)
//             await sendSms({ to: `+91${mobileNumber}`, message: `Your BookNOW login OTP is: ${otp}` });
//             res.status(200).json({ success: true, msg: 'OTP sent successfully.' });
//         } catch (smsError) {
//             console.error('SMS Service Error:', smsError.message);
//             // Don't crash the server. Send a specific error code back to the user.
//             // 503 Service Unavailable is appropriate here.
//             return res.status(503).json({ msg: 'The OTP service is currently unavailable. Please try again later.' });
//         }
//         // --- END IMPROVEMENT ---

//     } catch (err) { 
//         console.error("Send OTP controller error:", err);
//         res.status(500).json({ msg: 'Server error while processing your request.' }); 
//     }
// };

// // 4. Register new user with Email and send OTP
// exports.registerAndSendEmailOtp = async (req, res) => {
//     const { name, email, password, dob, mobileNumber } = req.body;
//     try {
//         if (await User.findOne({ email })) return res.status(400).json({ msg: 'This email is already registered.' });
//         if (mobileNumber && await User.findOne({ mobileNumber })) return res.status(400).json({ msg: 'This mobile number is already in use.' });

//         const user = new User({ name, email, password, dob, mobileNumber, isVerified: false });
//         const otp = await user.getOtp();
//         await user.save();
//         await sendEmail({ to: email, subject: 'Verify Your Email for BookNOW', html: `<h3>Your verification OTP is: ${otp}. It is valid for 5 minutes.</h3>` });

//         res.status(200).json({ success: true, msg: 'Verification OTP sent to your email.' });
//     } catch (err) { res.status(500).json({ msg: 'Server error' }); }
// };

// // 5. Verify OTP (for both email and mobile) and issue JWT
// exports.verifyOtpAndLogin = async (req, res) => {
//     const { identifier, otp } = req.body;
//     const isEmail = identifier.includes('@');
//     const query = isEmail ? { email: identifier.toLowerCase() } : { mobileNumber: identifier };
//     try {
//         const user = await User.findOne({ ...query, otpExpire: { $gt: Date.now() } }).select('+otp');
//         if (!user || !user.otp) return res.status(400).json({ msg: 'Invalid OTP or it has expired.' });
//         if (!await bcrypt.compare(otp, user.otp)) return res.status(400).json({ msg: 'Invalid OTP.' });

//         user.otp = undefined;
//         user.otpExpire = undefined;
//         user.isVerified = true;
//         await user.save({ validateBeforeSave: false });

//         const token = generateToken(user);
//         res.status(200).json({ token, user });
//     } catch (err) { res.status(500).json({ msg: 'Server error' }); }
// };

// // 6. Google Sign-In / Sign-Up
// exports.googleAuth = async (req, res) => {
//     const { credential } = req.body;
//     try {
//         const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
//         const { sub, email, name } = ticket.getPayload();

//         let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });
//         if (user) {
//             if (!user.googleId) user.googleId = sub;
//         } else {
//             user = await User.create({ googleId: sub, email, name, isVerified: true });
//         }
//         await user.save({ validateBeforeSave: false });
//         const token = generateToken(user);
//         res.status(200).json({ token, user });
//     } catch (err) { res.status(500).json({ msg: 'Google authentication failed' }); }
// };

// // 7. Complete Profile for new mobile users
// exports.completeProfile = async (req, res) => {
//     const { name, dob } = req.body;
//     if (!name || !dob) return res.status(400).json({ msg: 'Name and Date of Birth are required.' });
//     try {
//         const user = await User.findByIdAndUpdate(req.user.id, { name, dob, isVerified: true }, { new: true });
//         res.status(200).json(user);
//     } catch (err) { res.status(500).json({ msg: 'Server error' }); }
// };

// // 8. Get current user profile
// exports.getMe = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id);
//         res.json(user);
//     } catch (err) { res.status(500).send('Server Error'); }
// };


// // @desc    Forgot Password - Generate token & send email
// // @route   POST /api/auth/forgotpassword
// // @access  Public
// exports.forgotPassword = async (req, res) => {
//     const { email } = req.body;
//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             // For security, don't reveal that the user doesn't exist
//             return res.status(200).json({ success: true, data: 'If an account with that email exists, a reset link has been sent.' });
//         }

//         // Get reset token from User model method
//         const resetToken = user.getResetPasswordToken();
//         await user.save({ validateBeforeSave: false });

//         const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
//         const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the following link to reset your password: \n\n ${resetUrl}`;

//         await sendEmail({ to: user.email, subject: 'Password Reset Request', text: message });
//         res.status(200).json({ success: true, data: 'Email sent' });
//     } catch (err) {
//         console.error('Forgot Password Error:', err);
//         // Clear tokens if there was an error
//         req.user.resetPasswordToken = undefined;
//         req.user.resetPasswordExpire = undefined;
//         await req.user.save({ validateBeforeSave: false });
//         res.status(500).json({ msg: 'Email could not be sent' });
//     }
// };

// // @desc    Reset password using token
// // @route   PUT /api/auth/resetpassword/:resettoken
// // @access  Public
// exports.resetPassword = async (req, res) => {
//     const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
//     try {
//         const user = await User.findOne({
//             resetPasswordToken,
//             resetPasswordExpire: { $gt: Date.now() },
//         });

//         if (!user) {
//             return res.status(400).json({ msg: 'Invalid or expired token' });
//         }

//         user.password = req.body.password;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpire = undefined;
//         await user.save();
        
//         res.status(200).json({ success: true, msg: 'Password reset successfully' });
//     } catch (err) {
//         console.error('Reset Password Error:', err);
//         res.status(500).json({ msg: 'Server error' });
//     }
// };


// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) => {
    const payload = { user: { id: user.id, role: user.role } };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
};

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, organizationName } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ errors: [{ msg: 'User with this email already exists' }] });

        const finalRole = (role === 'organizer') ? 'organizer' : 'user';
        user = new User({
            name,
            email: email.toLowerCase(),
            password,
            role: finalRole,
            isApproved: (finalRole === 'user'),
            organizationName: finalRole === 'organizer' ? organizationName : undefined,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        const token = generateToken(user);
        res.status(201).json({ token, role: user.role, isApproved: user.isApproved });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ errors: [{ msg: 'Server error during registration' }] });
    }
};

exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });

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

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        console.error('GetMe Error:', err.message);
        res.status(500).json({ msg: 'Server error fetching user profile' });
    }
};

exports.forgotPassword = async (req, res) => {
    // This function is for standard password reset and can remain
};

exports.resetPassword = async (req, res) => {
    // This function is for standard password reset and can remain
};