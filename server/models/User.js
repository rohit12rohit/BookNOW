// server/models/User.js
// Purpose: Defines the schema for the User collection in MongoDB.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
        minlength: [6, 'Password must be at least 6 characters'],
        select: false 
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'],
        default: 'user'
    },
    // --- Organizer Specific ---
    organizationName: {
        type: String,
    },
    managedVenues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue'
    }],
    isApproved: { // For Organizer approval
        type: Boolean,
        default: false
    },
    // --- OTP & Verification Fields ---
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        select: false // Do not return OTP in queries
    },
    otpExpire: {
        type: Date,
        select: false
    },
    // --- Reset Password ---
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate Password Reset Token
UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);