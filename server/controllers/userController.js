// server/controllers/userController.js
const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateMyProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields that are allowed to be changed
        if (name) {
            user.name = name;
        }

        const updatedUser = await user.save();

        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });

    } catch (err) {
        console.error('Error updating user profile:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};