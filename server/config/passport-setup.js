// server/config/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Use absolute URL to prevent issues with proxies/production environments
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:5001'}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            const currentUser = await User.findOne({ googleId: profile.id });
            
            if (currentUser) {
                // User exists
                return done(null, currentUser);
            } 
            
            // If not, create new user
            const newUser = await new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                isApproved: true, // Auto-approve generic Google users?
            }).save();
            
            console.log(`New Google user created: ${newUser.email}`);
            done(null, newUser);
            
        } catch (err) {
            console.error('Passport Google Strategy Error:', err);
            done(err, null);
        }
    })
);