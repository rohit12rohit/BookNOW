// server/middleware/authMiddleware.js
// Purpose: Verify JWT, ensure user exists in DB, and attach user to request.

const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    // 1. Get token from header
    const authHeader = req.header('Authorization');
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        token = req.header('x-auth-token');
    }

    // 2. Check if token exists
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. SECURITY CHECK: Fetch user to ensure they still exist/aren't banned
        // We select '-password' to keep the object clean
        const user = await User.findById(decoded.user.id).select('-password');

        if (!user) {
            return res.status(401).json({ msg: 'Token is valid, but user no longer exists.' });
        }

        // 5. Attach full user object to request
        req.user = user; 
        
        next(); 

    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};