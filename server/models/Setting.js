// server/models/Setting.js
// Purpose: Defines the schema for application-wide settings like GST rate.

const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Setting name is required'],
        unique: true,
        trim: true,
        uppercase: true // e.g., 'GST_RATE', 'APP_VERSION'
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can store numbers, strings, booleans, objects
        required: [true, 'Setting value is required']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Setting', SettingSchema);