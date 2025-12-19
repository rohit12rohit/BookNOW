// server/models/User.js
// Purpose: Defines the schema for the User collection in MongoDB using Mongoose.

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        // required: [true, 'Please provide a password'], // Not required for Google OAuth
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Prevent password from being returned in queries by default
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    // --- Organizer Specific Fields ---
    organizationName: {
        type: String,
    },
    managedVenues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    }],
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

// --- Pre-save hook to hash password ---
UserSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Hash the password with cost of 10
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// --- Instance method to compare entered password with hashed password ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- Method to generate and hash password reset token ---
UserSchema.methods.getResetPasswordToken = function() {
    // 1. Generate Token (Plain text token)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash Token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set expire time (10 minutes from now)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    // 4. Return the PLAIN text token
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);