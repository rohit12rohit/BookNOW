// Standalone Seeder Script for BookNOW

// --- Configuration ---
// Load .env variables (optional, provides fallback for admin credentials)
require('dotenv').config({ path: './.env' }); // Assumes .env is in the same dir as script, adjust if needed

// Explicitly define the database connection string
const DB_URI = process.env.MONGODB_URI_SEEDER || "mongodb+srv://gawhadehimanshu1229:gawhadehimanshu1229@cluster0.klacfeo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Use user-provided URI

// Default Admin Credentials (use .env values if available, otherwise use these defaults)
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@booknow.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Default Admin';

// --- Required Modules ---
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Database Connection Function ---
const connectDB = async () => {
    console.log(`[DB] Attempting connection to: ${DB_URI}`);
    try {
        await mongoose.connect(DB_URI, {
            // Add options if needed based on your MongoDB version/setup
            // useNewUrlParser: true, // Deprecated
            // useUnifiedTopology: true, // Deprecated
            // useCreateIndex: true, // Deprecated
        });
        console.log(`[DB] MongoDB Connected: ${mongoose.connection.host}`);
    } catch (err) {
        console.error(`[DB] MongoDB Connection Error: ${err.message}`);
        process.exit(1); // Exit script if connection fails
    }
};

// --- Model Definitions (Inline for standalone script) ---
// It's better practice to require('./models/...') if this script lives in your project structure.
// For a truly standalone example, we define simplified schemas here.
// NOTE: Replace these with your actual model imports if running within the project structure.

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
    organizationName: { type: String },
    isApproved: { type: Boolean, default: false },
    managedVenues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],
    // Add reset token fields if needed for user model consistency
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const MovieSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    movieLanguage: { type: String, required: true }, // Using movieLanguage based on user preference
    genre: [{ type: String, required: true }],
    cast: [String], crew: [String], posterUrl: String, trailerUrl: String, censorRating: String, format: [String],
    averageRating: { type: Number, default: 0 },
    numberOfReviews: { type: Number, default: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
// Add indexes if running standalone frequently
// MovieSchema.index({ title: 'text', description: 'text' });
// MovieSchema.index({ movieLanguage: 1 });
// MovieSchema.index({ genre: 1 });
const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

const ScreenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    seatLayout: {
        rows: [{
            _id: false,
            rowId: { type: String, required: true },
            seats: [{
                _id: false,
                seatNumber: { type: String, required: true },
                type: { type: String, default: 'Normal' }
            }]
        }]
    }
});
const VenueSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { street: String, city: String, state: String, zipCode: String },
    facilities: [String],
    screens: [ScreenSchema],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const Venue = mongoose.models.Venue || mongoose.model('Venue', VenueSchema);

const ShowtimeSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    screenId: { type: mongoose.Schema.Types.ObjectId, required: true },
    screenName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: [String],
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
// Add pre-validate hook if needed
ShowtimeSchema.pre('validate', function(next) { if (this.movie && this.event) { next(new Error('Showtime cannot link Movie and Event.')); } else if (!this.movie && !this.event) { next(new Error('Showtime must link Movie or Event.')); } else { next(); } });
const Showtime = mongoose.models.Showtime || mongoose.model('Showtime', ShowtimeSchema);

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    language: String,
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    address: { street: String, city: String, state: String, zipCode: String },
    startDate: { type: Date, required: true },
    endDate: Date,
    imageUrl: String,
    tags: [String],
    organizerInfo: { name: String, contact: String },
    status: { type: String, enum: ['Scheduled', 'Postponed', 'Cancelled', 'Completed'], default: 'Scheduled' },
    createdAt: { type: Date, default: Date.now }
});
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

const ReviewSchema = new mongoose.Schema({
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    createdAt: { type: Date, default: Date.now }
});
ReviewSchema.index({ movie: 1, user: 1 }, { unique: true });
// Add static method/hooks for average rating if needed for standalone script consistency
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

const PromoCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number, required: true, min: 0 },
    description: String, minPurchaseAmount: { type: Number, default: 0 }, maxDiscountAmount: Number,
    validFrom: Date, validUntil: Date, maxUses: Number, uses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, createdAt: { type: Date, default: Date.now }
});
const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);

const CitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const City = mongoose.models.City || mongoose.model('City', CitySchema);


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
const sampleMoviesData = (adminUserId) => [
    { title: 'Kalki 2898-AD', description: 'A modern-day avatar of Vishnu...', releaseDate: new Date('2024-06-27T00:00:00.000Z'), duration: 181, movieLanguage: 'Telugu', genre: ['Sci-Fi', 'Action', 'Epic'], cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone', 'Disha Patani'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Kalki_2898_AD_poster.jpg/220px-Kalki_2898_AD_poster.jpg', censorRating: 'U/A', format: ['2D', 'IMAX', '3D'], addedBy: adminUserId },
    { title: 'Inside Out 2', description: 'Follow Riley, in her teenage years...', releaseDate: new Date('2024-06-14T00:00:00.000Z'), duration: 96, movieLanguage: 'English', genre: ['Animation', 'Comedy', 'Family'], cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/45/Inside_Out_2_poster.jpg/220px-Inside_Out_2_poster.jpg', censorRating: 'U', format: ['2D', '3D'], addedBy: adminUserId },
    { title: 'Singham Again', description: 'Upcoming action film directed by Rohit Shetty.', releaseDate: new Date('2024-11-01T00:00:00.000Z'), duration: 150, movieLanguage: 'Hindi', genre: ['Action', 'Drama'], cast: ['Ajay Devgn', 'Akshay Kumar', 'Ranveer Singh', 'Deepika Padukone', 'Tiger Shroff', 'Kareena Kapoor Khan', 'Arjun Kapoor'], posterUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Singham_Again_poster.jpg/220px-Singham_Again_poster.jpg', censorRating: 'N/A', format: ['2D'], addedBy: adminUserId },
];
const sampleVenuesData = (organizerId1, organizerId2) => [
    { name: 'INOX BMC Bhawani Mall', address: { street: 'Sahid Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751007' }, facilities: ['Parking', 'F&B Counter', 'Recliner Seats', 'Wheelchair Accessible'], screens: [ { name: 'Screen 1', capacity: 120, seatLayout: { rows: [{rowId: 'A', seats: [{seatNumber: '1', type: 'Normal'},{seatNumber: '2', type: 'Normal'},{seatNumber: '3', type: 'Normal'}]},{rowId: 'B', seats: [{seatNumber: '1', type: 'Normal'},{seatNumber: '2', type: 'Normal'}]}] } }, { name: 'Screen 2 (INSIGNIA)', capacity: 40, seatLayout: { rows: [{rowId: 'R', seats: [{seatNumber: '1', type: 'Recliner'},{seatNumber: '2', type: 'Recliner'},{seatNumber: '3', type: 'Recliner'},{seatNumber: '4', type: 'Recliner'}]}] } }, { name: 'Screen 3', capacity: 100, seatLayout: { rows: [{rowId: 'C', seats: [{seatNumber: '1'},{seatNumber: '2'}]},{rowId: 'D', seats: [{seatNumber: '1'},{seatNumber: '2'}]}] } } ], organizer: organizerId1, isActive: true },
    { name: 'Cinepolis Esplanade One', address: { street: 'Rasulgarh Industrial Estate', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751010' }, facilities: ['Parking', 'Food Court', 'VIP Seats'], screens: [ { name: 'Audi 1', capacity: 150, seatLayout: { rows: [{rowId: 'A', seats: [{seatNumber: '1'},{seatNumber: '2'}]},{rowId: 'B', seats: [{seatNumber: '1'},{seatNumber: '2'}]}] } }, { name: 'Audi 2', capacity: 130, seatLayout: { rows: [{rowId: 'A', seats: [{seatNumber: '1'},{seatNumber: '2'}]},{rowId: 'B', seats: [{seatNumber: '1'},{seatNumber: '2'}]}] } }, { name: 'Audi 3 (VIP)', capacity: 30, seatLayout: { rows: [{rowId: 'V', seats: [{seatNumber: '1', type: 'VIP'},{seatNumber: '2', type: 'VIP'}]}] } } ], organizer: organizerId2, isActive: true }
];
const today = new Date();
const sampleEventsData = [ { title: 'Startup Odisha Conclave', description: 'Annual conclave...', category: 'Business', address: { city: 'Bhubaneswar', state: 'Odisha'}, startDate: new Date(new Date().setDate(today.getDate() + 30)), tags: ['startup', 'business'], organizerInfo: { name: 'Startup Odisha'} }, { title: 'Local Cricket Match - Finals', description: 'Final match...', category: 'Sports', address: { city: 'Cuttack', state: 'Odisha'}, startDate: new Date(new Date().setDate(today.getDate() + 7)), tags: ['cricket', 'sports'], organizerInfo: { name: 'City Sports Association'} } ];
const samplePromoCodesData = [ { code: 'FIRSTBOOK', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 100, maxUses: 1000, isActive: true }, { code: 'WEEKDAY100', discountType: 'fixed', discountValue: 100, minPurchaseAmount: 300, isActive: true }, { code: 'EXPIREDCODE', discountType: 'percentage', discountValue: 50, validUntil: new Date(Date.now() - 24*60*60*1000), isActive: true }, { code: 'INACTIVECODE', discountType: 'fixed', discountValue: 20, isActive: false } ];
const sampleCitiesData = [ { name: 'Bhubaneswar', state: 'Odisha', isActive: true }, { name: 'Cuttack', state: 'Odisha', isActive: true }, { name: 'Puri', state: 'Odisha', isActive: true }, { name: 'Rourkela', state: 'Odisha', isActive: false } ];
console.log('Sample data defined.');

// Helper to format date for showtime creation
const formatDate = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]; // Fallback
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
};

// --- Seeding Function ---
const importData = async () => {
    console.log('[importData] Starting import...');
    try {
        console.log('[importData] Destroying existing data...');
        await Review.deleteMany(); await Showtime.deleteMany(); await Event.deleteMany();
        await Movie.deleteMany(); await Venue.deleteMany(); await User.deleteMany();
        await PromoCode.deleteMany(); await City.deleteMany();
        console.log('[importData] Existing data destroyed.');

        // --- Create Admin User ---
        console.log('[importData] Creating Admin User...');
        let adminUser = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
        if (!adminUser) {
             const salt = await bcrypt.genSalt(10);
             const hashedAdminPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);
             adminUser = await User.create({ name: DEFAULT_ADMIN_NAME, email: DEFAULT_ADMIN_EMAIL, password: hashedAdminPassword, role: 'admin', isApproved: true });
             console.log('[importData] Admin User Created.');
        } else if (adminUser.role !== 'admin') {
            adminUser.role = 'admin'; adminUser.isApproved = true; await adminUser.save();
             console.log('[importData] Existing user updated to Admin.');
        } else { console.log('[importData] Admin User already exists.'); }

        // --- Create Other Users ---
        console.log('[importData] Creating other Users...');
        const createdUsers = await User.insertMany(sampleUsersData);
        const organizer1 = createdUsers.find(u => u.email === 'org.inox.bbsr@example.com');
        const organizer2 = createdUsers.find(u => u.email === 'org.cinepolis.bbsr@example.com');
        const regularUser1 = createdUsers.find(u => u.email === 'user.test1@example.com');
        console.log(`[importData] Created ${createdUsers.length} other users.`);
        if (!organizer1 || !organizer2 || !regularUser1) throw new Error('Failed to create necessary users.');

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
        const venueInox = createdVenues.find(v => v.name.includes('INOX'));
        const venueCinepolis = createdVenues.find(v => v.name.includes('Cinepolis'));
        const showtimesToCreate = [];
        const todayDateStr = formatDate(new Date());
        const tomorrow = new Date(); tomorrow.setDate(new Date().getDate() + 1);
        const tomorrowDateStr = formatDate(tomorrow);

        if (movieKalki && venueInox && venueInox.screens.length > 1) {
            showtimesToCreate.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${todayDateStr}T19:00:00Z`), price: 250 });
            showtimesToCreate.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[1]._id, startTime: new Date(`${todayDateStr}T20:00:00Z`), price: 550 });
            showtimesToCreate.push({ movie: movieKalki._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${tomorrowDateStr}T19:00:00Z`), price: 260 });
        }
        if (movieInside && venueInox && venueInox.screens.length > 0) {
             showtimesToCreate.push({ movie: movieInside._id, venue: venueInox._id, screenId: venueInox.screens[0]._id, startTime: new Date(`${todayDateStr}T16:00:00Z`), price: 220 });
        }
         if (movieKalki && venueCinepolis && venueCinepolis.screens.length > 0) {
             showtimesToCreate.push({ movie: movieKalki._id, venue: venueCinepolis._id, screenId: venueCinepolis.screens[0]._id, startTime: new Date(`${todayDateStr}T18:00:00Z`), price: 240 });
         }

        let createdShowtimeCount = 0;
        for (const showtimeData of showtimesToCreate) {
             try {
                 const movieDoc = createdMovies.find(m => m._id.equals(showtimeData.movie));
                 const venueDoc = createdVenues.find(v => v._id.equals(showtimeData.venue));
                 const screenDoc = venueDoc?.screens.id(showtimeData.screenId);

                 if (movieDoc && venueDoc && screenDoc) {
                    const startTimeMs = new Date(showtimeData.startTime).getTime();
                    const durationMs = movieDoc.duration * 60000;
                    const bufferMs = 15 * 60000;
                    showtimeData.endTime = new Date(startTimeMs + durationMs + bufferMs);
                    showtimeData.totalSeats = screenDoc.capacity;
                    showtimeData.screenName = screenDoc.name;
                    showtimeData.bookedSeats = []; showtimeData.isActive = true;

                    await Showtime.create(showtimeData);
                    createdShowtimeCount++;
                 } else { console.warn(`Skipping showtime: Refs missing.`); }
            } catch(showtimeError) { console.error(`Error creating individual showtime: ${showtimeError.message}`); }
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
        console.log('-------------------------');
        console.log('Sample Login Credentials:');
        console.log(`  Admin: ${adminUser.email} / ${DEFAULT_ADMIN_PASSWORD}`);
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
        // await Booking.deleteMany(); // Uncomment if needed
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
    console.log('[run] Starting execution...');
    let success = false;
    try {
        console.log('[run] Connecting to DB...');
        await connectDB(); // Use the function defined above
        console.log('[run] DB Connected. Checking arguments...');

        if (process.argv[2] === '-d') {
            console.log('[run] Argument "-d" found. Calling destroyData...');
            success = await destroyData();
        } else {
            console.log('[run] No "-d" argument found or using "-i". Calling importData...');
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
