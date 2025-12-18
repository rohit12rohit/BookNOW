// server/middleware/roleMiddleware.js
// Purpose: Middleware functions to check user roles for authorization.

const User = require('../models/User'); // Required for the isOrganizer approval check

// Checks if the user attached by authMiddleware has the 'admin' role.
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed
    } else {
        res.status(403).json({ msg: 'Access denied. Admin role required.' }); // 403 Forbidden
    }
};

// Checks if the user is either 'organizer' OR 'admin'.
exports.isOrganizerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
        // Note: Further checks like 'isApproved' for organizers might be needed
        // depending on the specific route's requirements. Often handled in the controller
        // or a more specific middleware if needed universally for organizer actions.
        next(); // User is organizer or admin, proceed
    } else {
        res.status(403).json({ msg: 'Access denied. Organizer or Admin role required.' }); // 403 Forbidden
    }
};

// Checks if the user is specifically an 'organizer' AND is approved. (Modified in Phase 9)
exports.isOrganizer = async (req, res, next) => {
    // Basic role check from token
    if (!req.user || req.user.role !== 'organizer') {
        return res.status(403).json({ msg: 'Access denied. Organizer role required.' });
    }

    // --- Added Approval Check ---
    // Check the DB for current approval status
    try {
        const organizer = await User.findById(req.user.id).select('isApproved');
        if (!organizer) {
            return res.status(401).json({ msg: 'Organizer not found, authorization denied.' });
        }
        if (!organizer.isApproved) {
            return res.status(403).json({ msg: 'Access denied. Organizer account not approved.' });
        }
        // Organizer is found and approved
        next(); // Proceed
    } catch (error) {
        console.error("Error checking organizer approval status:", error);
        res.status(500).json({ msg: 'Server error during authorization check.' });
    }
};