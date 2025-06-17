// server/seeder.js (with Seat Layouts & Corrected Showtime PriceTier Seeding)

console.log('--- Running seeder.js script ---');
require('dotenv').config({ path: './.env' }); // Adjust path if needed

console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'Yes' : 'NO!');
console.log('DEFAULT_ADMIN_EMAIL loaded:', process.env.DEFAULT_ADMIN_EMAIL ? 'Yes' : 'NO!');
console.log('---------------------------------');

let mongoose, bcrypt, connectDB, User, Movie, Venue, Showtime, Event, Review, PromoCode, City;
try {
    mongoose = require('mongoose');
    bcrypt = require('bcryptjs');
    connectDB = require('./config/db');
    User = require('./models/User');
    Movie = require('./models/Movie');
    Venue = require('./models/Venue');
    Showtime = require('./models/Showtime');
    Event = require('./models/Event');
    Review = require('./models/Review');
    PromoCode = require('./models/PromoCode');
    City = require('./models/City');
    console.log('Models and core modules required successfully.');
} catch(requireError) {
    console.error("FATAL: Error requiring models/db:", requireError);
    process.exit(1);
}

// --- Sample Data Definitions ---
console.log('Defining sample data...');
const commonPassword = 'password123';
let hashedPassword;
try {
    const salt = bcrypt.genSaltSync(10);
    hashedPassword = bcrypt.hashSync(commonPassword, salt);
} catch(err) { console.error("FATAL: Error hashing password:", err); process.exit(1); }

const sampleUsersData = [
    { name: 'INOX BMC Bhawani (Org)', email: 'org.inox.bbsr@example.com', password: hashedPassword, role: 'organizer', organizationName: 'INOX Bhubaneswar', isApproved: true },
    { name: 'Cinepolis Esplanade (Org)', email: 'org.cinepolis.bbsr@example.com', password: hashedPassword, role: 'organizer', organizationName: 'Cinepolis Bhubaneswar', isApproved: true },
    { name: 'Test User One', email: 'user.test1@example.com', password: hashedPassword, role: 'user', isApproved: true },
    { name: 'Test User Two', email: 'user.test2@example.com', password: hashedPassword, role: 'user', isApproved: true }
];

// Make sure this function is defined if you're using it.
// If it's very long, you might have omitted it for brevity.
const sampleMoviesData = (adminUserId) => [
    { title: 'Kalki 2898-AD', description: 'A modern-day avatar of Vishnu...', releaseDate: new Date('2024-06-27T00:00:00.000Z'), duration: 181, movieLanguage: 'Telugu', genre: ['Sci-Fi', 'Action', 'Epic'], cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone', 'Disha Patani'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Kalki_2898_AD_poster.jpg/220px-Kalki_2898_AD_poster.jpg', censorRating: 'U/A', format: ['2D', 'IMAX', '3D'], addedBy: adminUserId },
    { title: 'Inside Out 2', description: 'Follow Riley, in her teenage years...', releaseDate: new Date('2024-06-14T00:00:00.000Z'), duration: 96, movieLanguage: 'English', genre: ['Animation', 'Comedy', 'Family'], cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/45/Inside_Out_2_poster.jpg/220px-Inside_Out_2_poster.jpg', censorRating: 'U', format: ['2D', '3D'], addedBy: adminUserId },
    { title: 'Singham Again', description: 'Upcoming action film directed by Rohit Shetty.', releaseDate: new Date('2024-11-01T00:00:00.000Z'), duration: 150, movieLanguage: 'Hindi', genre: ['Action', 'Drama'], cast: ['Ajay Devgn', 'Akshay Kumar', 'Ranveer Singh', 'Deepika Padukone', 'Tiger Shroff', 'Kareena Kapoor Khan', 'Arjun Kapoor'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Singham_Again_poster.jpg/220px-Singham_Again_poster.jpg', censorRating: 'N/A', format: ['2D'], addedBy: adminUserId },
];


const sampleVenuesData = (organizerId1, organizerId2) => [
    {
        name: 'INOX BMC Bhawani Mall',
        address: { street: 'Sahid Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751007' },
        facilities: ['Parking', 'F&B Counter', 'Recliner Seats', 'Wheelchair Accessible'],
        screens: [
            { name: 'Screen 1', capacity: 12, seatLayout: { rows: [ { rowId: 'A', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]}, { rowId: 'B', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]}, { rowId: 'C', seats: [ {seatNumber: '1', type: 'Premium'}, {seatNumber: '2', type: 'Premium'}, {seatNumber: '3', type: 'Premium'}, {seatNumber: '4', type: 'Premium'} ]} ] } },
            { name: 'Screen 2 (INSIGNIA)', capacity: 8, seatLayout: { rows: [ { rowId: 'R', seats: [ {seatNumber: '1', type: 'Recliner'}, {seatNumber: '2', type: 'Recliner'}, {seatNumber: '3', type: 'Recliner'}, {seatNumber: '4', type: 'Recliner'} ]}, { rowId: 'S', seats: [ {seatNumber: '1', type: 'Recliner'}, {seatNumber: '2', type: 'Recliner'}, {seatNumber: '3', type: 'Recliner'}, {seatNumber: '4', type: 'Recliner'} ]} ] } },
            { name: 'Screen 3', capacity: 10, seatLayout: { rows: [ { rowId: 'X', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'}, {seatNumber: '5', type: 'Normal'} ]}, { rowId: 'Y', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'}, {seatNumber: '5', type: 'Normal'} ]} ] } }
        ],
        organizer: organizerId1, isActive: true
    },
     {
        name: 'Cinepolis Esplanade One',
        address: { street: 'Rasulgarh Industrial Estate', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751010' },
        facilities: ['Parking', 'Food Court', 'VIP Seats', '4DX'],
        screens: [
            { name: 'Audi 1', capacity: 16, seatLayout: { rows: [ { rowId: 'A', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]}, { rowId: 'B', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]}, { rowId: 'C', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]}, { rowId: 'D', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'}, {seatNumber: '4', type: 'Normal'} ]} ] } },
            { name: 'Audi 2', capacity: 12, seatLayout: { rows: [ { rowId: 'E', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'} ]}, { rowId: 'F', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'} ]}, { rowId: 'G', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'} ]}, { rowId: 'H', seats: [ {seatNumber: '1', type: 'Normal'}, {seatNumber: '2', type: 'Normal'}, {seatNumber: '3', type: 'Normal'} ]} ] } },
            { name: 'Audi 3 (VIP)', capacity: 6, seatLayout: { rows: [ { rowId: 'V', seats: [ {seatNumber: '1', type: 'VIP'}, {seatNumber: '2', type: 'VIP'}, {seatNumber: '3', type: 'VIP'} ]}, { rowId: 'W', seats: [ {seatNumber: '1', type: 'VIP'}, {seatNumber: '2', type: 'VIP'}, {seatNumber: '3', type: 'VIP'} ]} ] } }
        ],
        organizer: organizerId2, isActive: true
    }
];

const today = new Date(); // Keep this definition
// Ensure sampleEventsData is defined if used, otherwise use an empty array or remove references
const sampleEventsData = [
    { title: 'Startup Odisha Conclave', description: 'Annual conclave...', category: 'Business', address: { city: 'Bhubaneswar', state: 'Odisha'}, startDate: new Date(new Date().setDate(today.getDate() + 30)), tags: ['startup', 'business'], organizerInfo: { name: 'Startup Odisha'} },
    { title: 'Local Cricket Match - Finals', description: 'Final match...', category: 'Sports', address: { city: 'Cuttack', state: 'Odisha'}, startDate: new Date(new Date().setDate(today.getDate() + 7)), tags: ['cricket', 'sports'], organizerInfo: { name: 'City Sports Association'} }
];
const samplePromoCodesData = [
    { code: 'FIRSTBOOK', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 100, maxUses: 1000, isActive: true }, { code: 'WEEKDAY100', discountType: 'fixed', discountValue: 100, minPurchaseAmount: 300, isActive: true }, { code: 'EXPIREDCODE', discountType: 'percentage', discountValue: 50, validUntil: new Date(Date.now() - 24*60*60*1000), isActive: true }, { code: 'INACTIVECODE', discountType: 'fixed', discountValue: 20, isActive: false }
];
const sampleCitiesData = [
    { name: 'Bhubaneswar', state: 'Odisha', isActive: true }, { name: 'Cuttack', state: 'Odisha', isActive: true }, { name: 'Puri', state: 'Odisha', isActive: true }, { name: 'Rourkela', state: 'Odisha', isActive: false }
];
console.log('Sample data defined.');

// Helper to format date (if still used for showtime string construction, otherwise not critical here)
// const formatDate = (date) => { ... };


const importData = async () => {
    console.log('[importData] Starting import...');
    try {
        console.log('[importData] Destroying existing data...');
        await Review.deleteMany(); await Showtime.deleteMany(); await Event.deleteMany(); await Movie.deleteMany(); await Venue.deleteMany(); await User.deleteMany(); await PromoCode.deleteMany(); await City.deleteMany();
        console.log('[importData] Existing data destroyed.');

        // --- Create Admin User ---
        console.log('[importData] Creating Admin User...');
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL; const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD; const adminName = process.env.DEFAULT_ADMIN_NAME; if (!adminEmail || !adminPassword || !adminName) throw new Error('Admin credentials missing in .env'); let adminUser = await User.findOne({ email: adminEmail }); if (!adminUser) { const salt = await bcrypt.genSalt(10); const hashedAdminPassword = await bcrypt.hash(adminPassword, salt); adminUser = await User.create({ name: adminName, email: adminEmail, password: hashedAdminPassword, role: 'admin', isApproved: true }); console.log('[importData] Admin User Created.'); } else if (adminUser.role !== 'admin') { adminUser.role = 'admin'; adminUser.isApproved = true; await adminUser.save(); console.log('[importData] Existing user updated to Admin.'); } else { console.log('[importData] Admin User already exists.'); }

        // --- Create Other Users ---
        console.log('[importData] Creating other Users...');
        const createdUsers = await User.insertMany(sampleUsersData);
        const organizer1 = createdUsers.find(u => u.email === 'org.inox.bbsr@example.com');
        const organizer2 = createdUsers.find(u => u.email === 'org.cinepolis.bbsr@example.com');
        const regularUser1 = createdUsers.find(u => u.email === 'user.test1@example.com');
        console.log(`[importData] Created ${createdUsers.length} other users.`);
        if (!organizer1 || !organizer2 || !regularUser1) throw new Error('Failed to create necessary users for seeding showtimes/reviews.');

        // --- Create Movies ---
        console.log('[importData] Creating Movies...');
        const moviesToSeed = sampleMoviesData(adminUser._id);
        const createdMovies = await Movie.insertMany(moviesToSeed);
        console.log(`[importData] Created ${createdMovies.length} movies.`);

        // --- Create Venues ---
        console.log('[importData] Creating Venues...');
        const venuesToSeed = sampleVenuesData(organizer1._id, organizer2._id);
        const createdVenues = await Venue.insertMany(venuesToSeed);
        console.log(`[importData] Created ${createdVenues.length} venues.`);

        // --- Create Showtimes ---
        console.log('[importData] Creating Showtimes...');
        const movieKalki = createdMovies.find(m => m.title.includes('Kalki'));
        const movieInside = createdMovies.find(m => m.title.includes('Inside Out'));
        const venueInox = createdVenues.find(v => v.name.includes('INOX BMC Bhawani Mall'));
        const venueCinepolis = createdVenues.find(v => v.name.includes('Cinepolis Esplanade One'));

        const showtimesToCreateInput = []; // This will hold the basic showtime info from your logic
        const todayDateStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(); tomorrow.setDate(new Date().getDate() + 1);
        const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

        if (movieKalki && venueInox && venueInox.screens.length > 1) {
            showtimesToCreateInput.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${todayDateStr}T19:00:00Z`), defaultPrice: 250 });
            showtimesToCreateInput.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[1]._id, startTime: new Date(`${todayDateStr}T20:00:00Z`), defaultPrice: 550 });
            showtimesToCreateInput.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${tomorrowDateStr}T19:00:00Z`), defaultPrice: 260 });
        }
        if (movieInside && venueInox && venueInox.screens.length > 0) {
            showtimesToCreateInput.push({ movie: movieInside._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${todayDateStr}T16:00:00Z`), defaultPrice: 220 });
        }
        if (movieKalki && venueCinepolis && venueCinepolis.screens.length > 0) {
            showtimesToCreateInput.push({ movie: movieKalki._id, venue: venueCinepolis._id, screenId: venueCinepolis.screens[0]._id, startTime: new Date(`${todayDateStr}T18:00:00Z`), defaultPrice: 240 });
        }

        let createdShowtimeCount = 0;
        for (const baseShowtimeData of showtimesToCreateInput) {
            try {
                const movieDoc = createdMovies.find(m => m._id.equals(baseShowtimeData.movie));
                const venueDoc = createdVenues.find(v => v._id.equals(baseShowtimeData.venue));
                const screenDoc = venueDoc?.screens.id(baseShowtimeData.screenId);

                if (movieDoc && venueDoc && screenDoc) {
                    const startTimeMs = new Date(baseShowtimeData.startTime).getTime();
                    const durationMs = movieDoc.duration * 60000;
                    const bufferMs = 15 * 60000;

                    const finalShowtimeData = {
                        movie: baseShowtimeData.movie,
                        // event: baseShowtimeData.event, // Add if you seed event-based showtimes
                        venue: baseShowtimeData.venue,
                        screenId: baseShowtimeData.screenId,
                        screenName: screenDoc.name,
                        startTime: new Date(baseShowtimeData.startTime),
                        endTime: new Date(startTimeMs + durationMs + bufferMs),
                        totalSeats: screenDoc.capacity,
                        bookedSeats: [],
                        isActive: true,
                        priceTiers: [] // Initialize
                    };

                    const seatTypesInLayout = new Set();
                    if (screenDoc.seatLayout && screenDoc.seatLayout.rows && screenDoc.seatLayout.rows.length > 0) {
                        screenDoc.seatLayout.rows.forEach(row => {
                            if (row.seats && row.seats.length > 0) {
                                row.seats.forEach(seat => {
                                    seatTypesInLayout.add(seat.type || 'Normal');
                                });
                            }
                        });
                    } else {
                        seatTypesInLayout.add('Normal');
                    }

                    const defaultPriceForTier = baseShowtimeData.defaultPrice || 200; // Use price from input or a fallback

                    finalShowtimeData.priceTiers = Array.from(seatTypesInLayout)
                        .filter(type => type !== 'Unavailable')
                        .map(type => ({
                            seatType: type,
                            price: defaultPriceForTier // Apply the default price to all tiers for simplicity in seeder
                        }));

                    if (finalShowtimeData.priceTiers.length === 0) {
                        finalShowtimeData.priceTiers.push({ seatType: 'Normal', price: defaultPriceForTier });
                    }
                    
                    // delete finalShowtimeData.defaultPrice; // Clean up temporary field if it was on baseShowtimeData

                    await Showtime.create(finalShowtimeData);
                    createdShowtimeCount++;
                } else {
                    console.warn(`Skipping showtime creation: Refs missing. Movie=${!!movieDoc}, Venue=${!!venueDoc}, Screen=${!!screenDoc} for base data:`, baseShowtimeData);
                }
            } catch(showtimeError) {
                console.error(`Error creating individual showtime: ${showtimeError.message} for base data:`, baseShowtimeData);
            }
        }
        console.log(`[importData] Created ${createdShowtimeCount} showtimes.`);

        // --- Create Events ---
        console.log('[importData] Creating Events...');
        const eventsToSeed = sampleEventsData;
        const createdEvents = await Event.insertMany(eventsToSeed);
        console.log(`[importData] Created ${createdEvents.length} events.`);

        // --- Create Promo Codes ---
        console.log('[importData] Creating Promo Codes...');
        const createdPromoCodes = await PromoCode.insertMany(samplePromoCodesData);
        console.log(`[importData] Created ${createdPromoCodes.length} promo codes.`);

        // --- Create Cities ---
        console.log('[importData] Creating Cities...');
        const createdCities = await City.insertMany(sampleCitiesData);
        console.log(`[importData] Created ${createdCities.length} cities.`);

        // --- Create Reviews ---
        console.log('[importData] Creating Reviews...');
        if (movieKalki && regularUser1) await Review.create({ rating: 5, comment: 'Mind blowing!', user: regularUser1._id, movie: movieKalki._id });
        if (movieInside && regularUser1) await Review.create({ rating: 4, comment: 'Very sweet movie.', user: regularUser1._id, movie: movieInside._id });
        console.log(`[importData] Created sample reviews.`);

        console.log('-------------------------');
        console.log('[importData] Data Seeded Successfully!');
        console.log('Sample Login Credentials:');
        console.log(`  Admin: ${adminUser.email} / ${process.env.DEFAULT_ADMIN_PASSWORD}`);
        console.log(`  Organizer 1 (Approved): ${organizer1.email} / ${commonPassword}`);
        console.log(`  Organizer 2 (Approved): ${organizer2.email} / ${commonPassword}`);
        console.log(`  User 1: ${regularUser1.email} / ${commonPassword}`);
        console.log('-------------------------');
        return true;

    } catch (error) {
        console.error('*************************');
        console.error('[importData] Error Seeding Data:', error);
        console.error('*************************');
        return false;
    }
};

// --- Destroy Data Function ---
const destroyData = async () => {
    console.log('[destroyData] Starting destroy...');
    try {
        console.log('[destroyData] Destroying ALL data...');
        await Review.deleteMany();
        // await Booking.deleteMany(); // Assuming Booking model exists and might need clearing
        await Showtime.deleteMany();
        await Event.deleteMany();
        await Movie.deleteMany();
        await Venue.deleteMany();
        await User.deleteMany();
        await PromoCode.deleteMany();
        await City.deleteMany();
        console.log('[destroyData] Data Destroyed Successfully!');
        return true;
    } catch (error) {
        console.error('[destroyData] Error destroying data:', error);
        return false;
    }
};

// --- Script Execution Logic ---
(async () => {
    console.log('[run] Starting seeder execution...');
    let success = false;
    try {
        console.log('[run] Connecting to DB...');
        await connectDB();
        console.log('[run] DB Connected. Checking arguments...');

        if (process.argv[2] === '--destroy' || process.argv[2] === '-d') {
            console.log('[run] Argument "-d" found. Calling destroyData...');
            success = await destroyData();
        } else {
            console.log('[run] No "-d" argument found or using "-i" (default). Calling importData...');
            success = await importData();
        }
        console.log(`[run] Operation finished. Success: ${success}`);

    } catch (runError) {
         console.error('[run] Error during run execution:', runError);
         success = false;
    } finally {
        console.log('[run] Disconnecting from DB...');
        try {
            await mongoose.disconnect();
            console.log('[run] DB Disconnected.');
        } catch (disconnectError) {
            console.error('[run] Error disconnecting from DB:', disconnectError);
        }
        console.log(`[run] Exiting script with code ${success ? 0 : 1}`);
        process.exit(success ? 0 : 1);
    }
})();

console.log('Script definition loaded. Async run function invoked.');