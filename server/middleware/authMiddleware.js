// server/middleware/authMiddleware.js
// Purpose: Middleware to verify JWT token and attach user payload to the request object.

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get token from header (Common ways: 'x-auth-token' header or 'Authorization: Bearer <token>')
    const authHeader = req.header('Authorization');
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract token from 'Bearer <token>' format
        token = authHeader.split(' ')[1];
    } else {
        // Fallback to checking 'x-auth-token' header
        token = req.header('x-auth-token');
    }

    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' }); // 401 Unauthorized
    }

    // 3. Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using secret

        // 4. Attach decoded user payload (contains id, role) to request object
        req.user = decoded.user;

        next(); // Call the next middleware or route handler

    } catch (err) {
        // Handle specific JWT errors if needed (e.g., TokenExpiredError)
        console.error('Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' }); // 401 Unauthorized
    }
};