// server/utils/seedAdmin.js
// Purpose: Standalone script to create a default admin user if one doesn't exist.

// Load .env variables FIRST
require('dotenv').config({ path: '../.env' }); // Adjust path if running script from server/utils folder directly

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db'); // Adjust path relative to this file
const User = require('../models/User'); // Adjust path relative to this file

// --- Core Seeding Logic Function ---
const seedAdminUser = async () => {
    // Check if default admin credentials are set
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    const adminName = process.env.DEFAULT_ADMIN_NAME;

    if (!adminEmail || !adminPassword || !adminName) {
        console.error('Error: Default admin user credentials (EMAIL, PASSWORD, NAME) not found in .env file.');
        return false; // Indicate failure
    }

    try {
        // Check if an admin user already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. No action taken.');
            return true; // Indicate success (no action needed)
        }

        // Check if the specific default email exists with a different role
        const userWithEmail = await User.findOne({ email: adminEmail });
        if (userWithEmail) {
            console.log(`User with email ${adminEmail} exists but is not admin. Updating role...`);
            userWithEmail.role = 'admin';
            userWithEmail.isApproved = true;
            await userWithEmail.save();
            console.log(`Updated user ${adminEmail} to admin role.`);
            return true; // Indicate success
        }

        // If no admin and no user with the default email exists, create the default admin
        console.log('No admin user found. Creating default admin...');

        // Hash the default password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create the new admin user
        await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            isApproved: true
        });

        console.log(`Default admin user created successfully with email: ${adminEmail}`);
        return true; // Indicate success

    } catch (error) {
        console.error('Error during admin user seeding:', error.message);
        return false; // Indicate failure
    }
};

// --- Script Execution Logic ---
const runSeed = async () => {
    console.log('Connecting to DB for admin seeding...');
    await connectDB(); // Establish DB connection

    const success = await seedAdminUser(); // Run the seeding logic

    if (success) {
        console.log('Admin seeding process completed.');
    } else {
        console.log('Admin seeding process failed.');
    }

    console.log('Disconnecting from DB...');
    await mongoose.disconnect(); // Disconnect after seeding is done
    process.exit(success ? 0 : 1); // Exit with code 0 on success, 1 on failure
};

// --- Run the script ---
runSeed();