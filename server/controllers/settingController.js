// server/controllers/settingController.js
// Purpose: Contains logic for managing application settings.

const Setting = require('../models/Setting');
const { validationResult } = require('express-validator');

// @desc    Get a single setting by name
// @route   GET /api/settings/:name
// @access  Public (for some settings like GST rate)
exports.getSetting = async (req, res) => {
    try {
        const settingName = req.params.name.toUpperCase();
        const setting = await Setting.findOne({ name: settingName });

        if (!setting) {
            return res.status(404).json({ msg: `Setting '${settingName}' not found.` });
        }

        res.status(200).json(setting);
    } catch (err) {
        console.error(`Error fetching setting '${req.params.name}':`, err.message);
        res.status(500).json({ msg: 'Server error fetching setting' });
    }
};

// @desc    Update a setting by name
// @route   PUT /api/settings/:name
// @access  Private (Admin Only)
exports.updateSetting = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const settingName = req.params.name.toUpperCase();
        const { value, description } = req.body;

        let setting = await Setting.findOne({ name: settingName });

        if (!setting) {
            return res.status(404).json({ msg: `Setting '${settingName}' not found.` });
        }

        setting.value = value;
        if (description !== undefined) {
            setting.description = description;
        }
        setting.lastUpdated = Date.now();

        await setting.save();
        res.status(200).json(setting);
    } catch (err) {
        console.error(`Error updating setting '${req.params.name}':`, err.message);
        res.status(500).json({ msg: 'Server error updating setting' });
    }
};

// @desc    Get all settings (Admin Only)
// @route   GET /api/settings
// @access  Private (Admin Only)
exports.getAllSettings = async (req, res) => {
    try {
        const settings = await Setting.find().sort({ name: 1 });
        res.status(200).json(settings);
    } catch (err) {
        console.error('Error fetching all settings:', err.message);
        res.status(500).json({ msg: 'Server error fetching settings' });
    }
};

// @desc    Create a new setting (Admin Only)
// @route   POST /api/settings
// @access  Private (Admin Only)
exports.createSetting = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, value, description } = req.body;
        const newSetting = new Setting({
            name: name.toUpperCase(),
            value,
            description
        });
        const setting = await newSetting.save();
        res.status(201).json(setting);
    } catch (err) {
        console.error('Error creating setting:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Setting with this name already exists.' });
        }
        res.status(500).json({ msg: 'Server error creating setting' });
    }
};