// server/middleware/roleMiddleware.js
// Purpose: Authorization checks based on user roles.

// Checks if the user is an admin
exports.isAdmin = (req, res, next) => {
    // req.user is guaranteed to exist due to authMiddleware running first
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Admin role required.' });
    }
};

// Checks if the user is an organizer OR admin
exports.isOrganizerOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
        next();
    } else {
        res.status(403).json({ msg: 'Access denied. Organizer or Admin role required.' });
    }
};

// Checks if the user is a specific APPROVED organizer
exports.isOrganizer = (req, res, next) => {
    if (!req.user || req.user.role !== 'organizer') {
        return res.status(403).json({ msg: 'Access denied. Organizer role required.' });
    }

    // Check approval status (available on req.user from authMiddleware)
    if (!req.user.isApproved) {
        return res.status(403).json({ msg: 'Access denied. Organizer account pending approval.' });
    }

    next();
};