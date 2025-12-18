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
        // options for google strategy
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
    }, (accessToken, refreshToken, profile, done) => {
        // check if user already exists in our db
        User.findOne({googleId: profile.id}).then((currentUser) => {
            if(currentUser){
                // already have the user
                console.log('user is: ', currentUser);
                done(null, currentUser);
            } else {
                // if not, create user in our db
                new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    isApproved: true,
                }).save().then((newUser) => {
                    console.log('new user created: ' + newUser);
                    done(null, newUser);
                });
            }
        })
    })
);