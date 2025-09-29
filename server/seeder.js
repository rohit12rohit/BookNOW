// server/seeder.js (Final Verified Version with Common URLs and 5-Day Showtimes)

console.log('--- Running seeder.js script ---');
require('dotenv').config({ path: './.env' }); // Adjust path if needed

console.log('MONGODB_URI loaded:', process.env.MONGODB_URI ? 'Yes' : 'NO!');
console.log('DEFAULT_ADMIN_EMAIL loaded:', process.env.DEFAULT_ADMIN_EMAIL ? 'Yes' : 'NO!');
console.log('---------------------------------');

let mongoose, bcrypt, connectDB, User, Movie, Venue, Showtime, Event, Review, PromoCode, City, Setting;
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
    Setting = require('./models/Setting');
    console.log('Models and core modules required successfully.');
} catch(requireError) {
    console.error("FATAL: Error requiring models/db:", requireError);
    process.exit(1);
}

// --- Configuration for Seeder ---
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@booknow.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Default Admin';
const COMMON_USER_PASSWORD = 'password123';

const NUM_DAYS_FOR_SHOWTIMES = 5;
const BASE_TICKET_PRICE = 150;
const DEFAULT_GST_RATE = 18;

// NEW: Common URLs for testing
const COMMON_MOVIE_POSTER_URL = 'https://placehold.co/300x450/FF0000/FFFFFF?text=MOVIE+POSTER';
const COMMON_EVENT_IMAGE_URL = 'https://placehold.co/600x400/0000FF/FFFFFF?text=EVENT+IMAGE';
const COMMON_TRAILER_URL = 'https://www.youtube.com/watch?v=zSWdZVtXT7E'; // Example: Interstellar Official Trailer - A valid YouTube URL

// Helper to get a random integer within a range
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// Helper to get a random element from an array
const getRandomElement = (arr) => arr[getRandomInt(0, arr.length - 1)];

// --- Sample Data Definitions ---
console.log('Defining sample data...');

let hashedPasswordForUsers;
try {
    const salt = bcrypt.genSaltSync(10);
    hashedPasswordForUsers = bcrypt.hashSync(COMMON_USER_PASSWORD, salt);
} catch(err) { console.error("FATAL: Error hashing common user password:", err); process.exit(1); }

const sampleUsersData = [
    { name: 'INOX Forum (Org)', email: 'org.inox.bbsr@example.com', password: hashedPasswordForUsers, role: 'organizer', organizationName: 'INOX Bhubaneswar', isApproved: true },
    { name: 'Cinepolis Central (Org)', email: 'org.cinepolis.bbsr@example.com', password: hashedPasswordForUsers, role: 'organizer', organizationName: 'Cinepolis Bhubaneswar', isApproved: true },
    { name: 'PVR Theatres (Org)', email: 'org.pvr.bbsr@example.com', password: hashedPasswordForUsers, role: 'organizer', organizationName: 'PVR Bhubaneswar', isApproved: true },
    { name: 'Test User One', email: 'user.test1@example.com', password: hashedPasswordForUsers, role: 'user', isApproved: true },
    { name: 'Test User Two', email: 'user.test2@example.com', password: hashedPasswordForUsers, role: 'user', isApproved: true },
    { name: 'New Organizer (Pending)', email: 'org.pending@example.com', password: hashedPasswordForUsers, role: 'organizer', organizationName: 'New Events Co', isApproved: false }
];

// Updated sampleMoviesData to use common URLs
const sampleMoviesData = (adminUserId) => [
    { title: 'Kalki 2898-AD', description: 'A modern-day avatar of Vishnu, a Hindu deity, who is believed to appear in the future to save the world from chaos and destruction.', releaseDate: new Date('2024-06-27T00:00:00.000Z'), duration: 181, movieLanguage: 'Telugu', genre: ['Sci-Fi', 'Action', 'Epic'], cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone', 'Disha Patani'], crew: ['Director: Nag Ashwin', 'Producer: C. Aswani Dutt'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U/A', format: ['2D', 'IMAX', '3D'], addedBy: adminUserId },
    { title: 'Inside Out 2', description: 'Follow Riley, in her teenage years, as new emotions like Anxiety, Envy, Ennui, and Embarrassment join Joy, Sadness, Anger, Fear, and Disgust.', releaseDate: new Date('2024-06-14T00:00:00.000Z'), duration: 96, movieLanguage: 'English', genre: ['Animation', 'Comedy', 'Family'], cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman', 'Tony Hale'], crew: ['Director: Kelsey Mann', 'Producer: Mark Nielsen'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U', format: ['2D', '3D'], addedBy: adminUserId },
    { title: 'Singham Again', description: 'Upcoming action film directed by Rohit Shetty, a sequel to Singham Returns.', releaseDate: new Date('2024-11-01T00:00:00.000Z'), duration: 150, movieLanguage: 'Hindi', genre: ['Action', 'Drama'], cast: ['Ajay Devgn', 'Akshay Kumar', 'Ranveer Singh', 'Deepika Padukone', 'Tiger Shroff', 'Kareena Kapoor Khan', 'Arjun Kapoor'], crew: ['Director: Rohit Shetty', 'Producer: Rohit Shetty'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'N/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Dune: Part Two', description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.', releaseDate: new Date('2024-03-01T00:00:00.000Z'), duration: 166, movieLanguage: 'English', genre: ['Sci-Fi', 'Adventure'], cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], crew: ['Director: Denis Villeneuve', 'Composer: Hans Zimmer'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'PG-13', format: ['2D', 'IMAX', '4DX'], addedBy: adminUserId },
    { title: 'Interstellar', description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', releaseDate: new Date('2014-11-07T00:00:00.000Z'), duration: 169, movieLanguage: 'English', genre: ['Sci-Fi', 'Drama'], cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], crew: ['Director: Christopher Nolan', 'Composer: Hans Zimmer'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'PG-13', format: ['2D', 'IMAX'], addedBy: adminUserId },
    { title: 'Pathaan', description: 'A RAW field agent caught in a dangerous mission, battling a ruthless terrorist group.', releaseDate: new Date('2023-01-25T00:00:00.000Z'), duration: 146, movieLanguage: 'Hindi', genre: ['Action', 'Thriller'], cast: ['Shah Rukh Khan', 'Deepika Padukone', 'John Abraham'], crew: ['Director: Siddharth Anand', 'Producer: Aditya Chopra'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Jawan', description: 'A high-octane action thriller that outlines the emotional journey of a man who is set to rectify the wrongs in society.', releaseDate: new Date('2023-09-07T00:00:00.000Z'), duration: 169, movieLanguage: 'Hindi', genre: ['Action', 'Thriller'], cast: ['Shah Rukh Khan', 'Nayanthara', 'Vijay Sethupathi'], crew: ['Director: Atlee', 'Producer: Gauri Khan'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Oppenheimer', description: 'The story of J. Robert Oppenheimer, the theoretical physicist who helped develop the first nuclear weapons.', releaseDate: new Date('2023-07-21T00:00:00.000Z'), duration: 180, movieLanguage: 'English', genre: ['Biographical', 'Drama', 'History'], cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'], crew: ['Director: Christopher Nolan', 'Composer: Ludwig Göransson'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'R', format: ['IMAX'], addedBy: adminUserId },
    { title: 'Salaar: Part 1 – Ceasefire', description: 'A gang leader makes a promise to his dying friend by taking on other criminal gangs.', releaseDate: new Date('2023-12-22T00:00:00.000Z'), duration: 175, movieLanguage: 'Telugu', genre: ['Action', 'Thriller'], cast: ['Prabhas', 'Prithviraj Sukumaran', 'Shruti Haasan'], crew: ['Director: Prashanth Neel', 'Producer: Vijay Kiragandur'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'A', format: ['2D'], addedBy: adminUserId },
    { title: 'Animal', description: 'A son\'s obsessive quest for his father\'s love, leading him down a path of violence.', releaseDate: new Date('2023-12-01T00:00:00.000Z'), duration: 201, movieLanguage: 'Hindi', genre: ['Action', 'Drama', 'Crime'], cast: ['Ranbir Kapoor', 'Anil Kapoor', 'Bobby Deol', 'Rashmika Mandanna'], crew: ['Director: Sandeep Reddy Vanga', 'Producer: Bhushan Kumar'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'A', format: ['2D'], addedBy: adminUserId },
    { title: 'Leo', description: 'A mild-mannered cafe owner\'s past resurfaces when he is tracked down by hitmen.', releaseDate: new Date('2023-10-19T00:00:00.000Z'), duration: 160, movieLanguage: 'Tamil', genre: ['Action', 'Thriller'], cast: ['Joseph Vijay', 'Trisha Krishnan', 'Sanjay Dutt'], crew: ['Director: Lokesh Kanagaraj', 'Producer: S. S. Lalit Kumar'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Pushpa 2: The Rule', description: 'The sequel to Pushpa: The Rise, continuing the story of Pushpa Raj.', releaseDate: new Date('2025-02-14T00:00:00.000Z'), duration: 180, movieLanguage: 'Telugu', genre: ['Action', 'Drama'], cast: ['Allu Arjun', 'Fahadh Faasil', 'Rashmika Mandanna'], crew: ['Director: Sukumar', 'Producer: Naveen Yerneni'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'U/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Devara', description: 'A fierce young man fights against brutal forces of nature and humanity.', releaseDate: new Date('2024-10-10T00:00:00.000Z'), duration: 160, movieLanguage: 'Telugu', genre: ['Action', 'Drama'], cast: ['Jr. NTR', 'Janhvi Kapoor', 'Saif Ali Khan'], crew: ['Director: Koratala Siva', 'Producer: Sudhakar Mikkilineni'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'N/A', format: ['2D'], addedBy: adminUserId },
    { title: 'Welcome to the Jungle', description: 'A new adventure in the Jumanji universe.', releaseDate: new Date('2025-12-25T00:00:00.000Z'), duration: 120, movieLanguage: 'English', genre: ['Adventure', 'Comedy'], cast: ['Dwayne Johnson', 'Kevin Hart', 'Jack Black'], crew: ['Director: Jake Kasdan', 'Producer: Matt Tolmach'], posterUrl: COMMON_MOVIE_POSTER_URL, trailerUrl: COMMON_TRAILER_URL, censorRating: 'PG-13', format: ['2D', '3D'], addedBy: adminUserId }
];


const today = new Date();
// Updated sampleEventsData to use common URLs and include 'location'
const sampleEventsData = (organizerId1, organizerId2) => [
    { title: 'Startup Odisha Conclave 2025', description: 'Annual conclave for startups in Odisha, bringing together investors, mentors, and innovators for networking and pitching sessions.', category: 'Business', eventLanguage: 'English', address: { city: 'Bhubaneswar', state: 'Odisha'}, startDate: new Date(new Date().setDate(today.getDate() + 2)), endDate: new Date(new Date().setDate(today.getDate() + 3)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['startup', 'business', 'networking', 'innovation'], organizerInfo: { name: 'Startup Odisha Board', contact: 'contact@startupodisha.com'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'Local Cricket Match - Finals', description: 'The thrilling finals of the inter-city cricket tournament, showcasing local talent and intense competition.', category: 'Sports', eventLanguage: 'Odia, Hindi', address: { city: 'Cuttack', state: 'Odisha', street: 'Barabati Stadium Road'}, startDate: new Date(new Date().setDate(today.getDate() + 0)), endDate: new Date(new Date().setDate(today.getDate() + 0)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Cuttack', tags: ['cricket', 'sports', 'final'], organizerInfo: { name: 'City Sports Association', contact: 'sports@cuttack.org'}, organizer: organizerId2, status: 'Scheduled' },
    { title: 'Bhubaneswar Music Festival', description: 'A multi-day music festival featuring local and national artists across various genres like folk, classical, and contemporary.', category: 'Music', eventLanguage: 'Multi-lingual', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'Utkal Mandap'}, startDate: new Date(new Date().setDate(today.getDate() + 4)), endDate: new Date(new Date().setDate(today.getDate() + 5)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['music', 'festival', 'live', 'culture'], organizerInfo: { name: 'Odisha Cultural Forum'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'State Level Marathon 2025', description: 'Annual marathon event for professional and amateur runners. Includes 5K, 10K, and Full Marathon categories.', category: 'Sports', eventLanguage: 'English', address: { city: 'Puri', state: 'Odisha', street: 'Marine Drive'}, startDate: new Date(new Date().setDate(today.getDate() + 1)), endDate: new Date(new Date().setDate(today.getDate() + 1)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Puri', tags: ['marathon', 'running', 'fitness'], organizerInfo: { name: 'Puri Athletics Club'}, organizer: organizerId2, status: 'Scheduled' },
    { title: 'International Food Expo', description: 'Experience cuisines from around the world under one roof. Food stalls, cooking demonstrations, and culinary workshops.', category: 'Food & Drink', eventLanguage: 'English', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'Exhibition Ground'}, startDate: new Date(new Date().setDate(today.getDate() + 3)), endDate: new Date(new Date().setDate(today.getDate() + 4)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['food', 'expo', 'international', 'cuisine'], organizerInfo: { name: 'Global Food Events'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'Classical Dance & Music Evening', description: 'An enchanting evening dedicated to classical Indian dance and music performances by renowned artists.', category: 'Theatre', eventLanguage: 'Hindi, Sanskrit', address: { city: 'Cuttack', state: 'Odisha', street: 'Kala Vikas Kendra'}, startDate: new Date(new Date().setDate(today.getDate() + 0)), endDate: new Date(new Date().setDate(today.getDate() + 0)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Cuttack', tags: ['classical', 'dance', 'music', 'indian'], organizerInfo: { name: 'Sanskriti Kala Parishad'}, organizer: organizerId2, status: 'Scheduled' },
    { title: 'Tech Innovation Summit', description: 'A summit focused on emerging technologies, AI, blockchain, and digital transformation. Features keynotes and panel discussions.', category: 'Business', eventLanguage: 'English', address: { city: 'Rourkela', state: 'Odisha', street: 'NIT Rourkela Auditorium'}, startDate: new Date(new Date().setDate(today.getDate() + 1)), endDate: new Date(new Date().setDate(today.getDate() + 2)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Rourkela', tags: ['tech', 'innovation', 'AI', 'summit'], organizerInfo: { name: 'Odisha Tech Council'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'Odisha Handloom & Handicraft Fair', description: 'Showcasing the rich cultural heritage of Odisha through traditional handlooms and exquisite handicrafts.', category: 'Exhibition', eventLanguage: 'Odia', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'IDCO Exhibition Ground'}, startDate: new Date(new Date().setDate(today.getDate() + 4)), endDate: new Date(new Date().setDate(today.getDate() + 5)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['handloom', 'handicraft', 'culture', 'fair'], organizerInfo: { name: 'ORTPC'}, organizer: organizerId2, status: 'Scheduled' },
    { title: 'Youth Entrepreneurship Workshop', description: 'An intensive workshop designed to equip young minds with entrepreneurial skills, business planning, and startup strategies.', category: 'Workshop', eventLanguage: 'English, Hindi', address: { city: 'Cuttack', state: 'Odisha', street: 'Hotel Mayfair'}, startDate: new Date(new Date().setDate(today.getDate() + 2)), endDate: new Date(new Date().setDate(today.getDate() + 2)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Cuttack', tags: ['youth', 'entrepreneurship', 'workshop', 'startup'], organizerInfo: { name: 'Youth Incubation Center'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'Stand-up Comedy Night', description: 'Laugh out loud with some of the best stand-up comedians from across the country.', category: 'Comedy', eventLanguage: 'Hindi, English', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'Xavier Institute Auditorium'}, startDate: new Date(new Date().setDate(today.getDate() + 3)), endDate: new Date(new Date().setDate(today.getDate() + 3)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['comedy', 'stand-up', 'live'], organizerInfo: { name: 'Laugh Factory India'}, organizer: organizerId2, status: 'Scheduled' },
    { title: 'International Film Festival of Odisha', description: 'A week-long celebration of cinema, featuring screenings of international and national award-winning films, director\'s talks, and workshops.', category: 'Arts', eventLanguage: 'Multi-lingual', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'KIIT University'}, startDate: new Date(new Date().setDate(today.getDate() + 10)), endDate: new Date(new Date().setDate(today.getDate() + 12)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['film', 'festival', 'cinema', 'international'], organizerInfo: { name: 'Odisha Film Academy'}, organizer: organizerId1, status: 'Scheduled' },
    { title: 'Rock Music Concert', description: 'Headbang to the electrifying tunes of popular rock bands, a night of high-energy performances.', category: 'Music', eventLanguage: 'English', address: { city: 'Bhubaneswar', state: 'Odisha', street: 'Janta Maidan'}, startDate: new Date(new Date().setDate(today.getDate() + 5)), endDate: new Date(new Date().setDate(today.getDate() + 5)), imageUrl: COMMON_EVENT_IMAGE_URL, trailerUrl: COMMON_TRAILER_URL, location: 'Bhubaneswar', tags: ['rock', 'music', 'concert', 'live'], organizerInfo: { name: 'Soundwave Events'}, organizer: organizerId2, status: 'Scheduled' }
];

const sampleVenuesData = (organizerId1, organizerId2, organizerId3) => [
    {
        name: 'INOX Forum Mall',
        address: { street: 'Forum Mart, Kharavela Nagar', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751001' },
        facilities: ['Parking', 'F&B Counter', 'Recliner Seats', 'Wheelchair Accessible'],
        screens: [
            { name: 'Screen 1 (Standard)', capacity: 120, seatLayout: { rows: [ { rowId: 'A', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'B', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'C', seats: Array.from({length: 4}, (_,i) => ({seatNumber: `${i+1}`, type: 'Premium'})), } ] } },
            { name: 'Screen 2 (INSIGNIA)', capacity: 40, seatLayout: { rows: [ { rowId: 'R', seats: Array.from({length: 8}, (_,i) => ({seatNumber: `${i+1}`, type: 'Recliner'})), }, { rowId: 'S', seats: Array.from({length: 8}, (_,i) => ({seatNumber: `${i+1}`, type: 'Recliner'})), } ] } },
            { name: 'Screen 3', capacity: 80, seatLayout: { rows: [ { rowId: 'D', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'E', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), } ] } }
        ],
        organizer: organizerId1, isActive: true
    },
    {
        name: 'Cinepolis Esplanade One',
        address: { street: 'Rasulgarh Industrial Estate', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751010' },
        facilities: ['Parking', 'Food Court', 'VIP Seats', '4DX', 'Gaming Zone'],
        screens: [
            { name: 'Audi 1 (Standard)', capacity: 150, seatLayout: { rows: [ { rowId: 'A', seats: Array.from({length: 15}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'B', seats: Array.from({length: 15}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), } ] } },
            { name: 'Audi 2 (VIP)', capacity: 60, seatLayout: { rows: [ { rowId: 'V', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'VIP'})), }, { rowId: 'W', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'VIP'})), } ] } },
            { name: 'Audi 3 (4DX)', capacity: 90, seatLayout: { rows: [ { rowId: 'F', seats: Array.from({length: 12}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'G', seats: Array.from({length: 12}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), } ] } }
        ],
        organizer: organizerId2, isActive: true
    },
    {
        name: 'PVR DLF Mall',
        address: { street: 'DLF Cybercity, Patia', city: 'Bhubaneswar', state: 'Odisha', zipCode: '751024' },
        facilities: ['Parking', 'Food Court', 'PVR LUXE'],
        screens: [
            { name: 'Screen 1 (LUXE)', capacity: 100, seatLayout: { rows: [ { rowId: 'L', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Luxury'})), }, { rowId: 'X', seats: Array.from({length: 10}, (_,i) => ({seatNumber: `${i+1}`, type: 'Luxury'})), } ] } },
            { name: 'Screen 2 (Standard)', capacity: 130, seatLayout: { rows: [ { rowId: 'A', seats: Array.from({length: 13}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), }, { rowId: 'B', seats: Array.from({length: 13}, (_,i) => ({seatNumber: `${i+1}`, type: 'Normal'})), } ] } }
        ],
        organizer: organizerId3, isActive: true
    }
];

const samplePromoCodesData = [
    { code: 'FIRSTBOOK', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 100, maxUses: 1000, isActive: true, description: '25% off up to Rs. 100 on first booking' },
    { code: 'WEEKDAY100', discountType: 'fixed', discountValue: 100, minPurchaseAmount: 300, isActive: true, description: 'Rs. 100 off on minimum purchase of Rs. 300' },
    { code: 'BIGSAVE50', discountType: 'percentage', discountValue: 50, maxDiscountAmount: 250, maxUses: 500, isActive: true, description: '50% off up to Rs. 250' },
    { code: 'WELCOMEBACK', discountType: 'fixed', discountValue: 50, minPurchaseAmount: 200, isActive: true, description: 'Rs. 50 off for returning customers' },
    { code: 'EXPIREDCODE', discountType: 'percentage', discountValue: 50, validUntil: new Date(Date.now() - 24*60*60*1000), isActive: false, description: 'Expired test code' },
    { code: 'INACTIVECODE', discountType: 'fixed', discountValue: 20, isActive: false, description: 'Inactive test code' }
];
const sampleCitiesData = [
    { name: 'Bhubaneswar', state: 'Odisha', isActive: true },
    { name: 'Cuttack', state: 'Odisha', isActive: true },
    { name: 'Puri', state: 'Odisha', isActive: true },
    { name: 'Rourkela', state: 'Odisha', isActive: false },
    { name: 'Sambalpur', state: 'Odisha', isActive: true }
];
console.log('Sample data defined.');


const importData = async () => {
    console.log('[importData] Starting import...');
    try {
        console.log('[importData] Destroying existing data...');
        await Review.deleteMany();
        await Showtime.deleteMany();
        await Event.deleteMany();
        await Movie.deleteMany();
        await Venue.deleteMany();
        await User.deleteMany();
        await PromoCode.deleteMany();
        await City.deleteMany();
        await Setting.deleteMany();
        console.log('[importData] Existing data destroyed.');

        // --- Create Admin User ---
        console.log('[importData] Creating Admin User...');
        const adminEmail = DEFAULT_ADMIN_EMAIL; const adminPassword = DEFAULT_ADMIN_PASSWORD; const adminName = DEFAULT_ADMIN_NAME;
        if (!adminEmail || !adminPassword || !adminName) throw new Error('Admin credentials missing in .env');
        let adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
             const salt = await bcrypt.genSalt(10);
             const hashedAdminPassword = await bcrypt.hash(adminPassword, salt);
             adminUser = await User.create({ name: adminName, email: adminEmail, password: hashedAdminPassword, role: 'admin', isApproved: true });
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
        const organizer3 = createdUsers.find(u => u.email === 'org.pvr.bbsr@example.com');
        const regularUser1 = createdUsers.find(u => u.email === 'user.test1@example.com');
        const regularUser2 = createdUsers.find(u => u.email === 'user.test2@example.com');
        console.log(`[importData] Created ${createdUsers.length} other users.`);
        if (!organizer1 || !organizer2 || !organizer3 || !regularUser1 || !regularUser2) throw new Error('Failed to create necessary users for seeding.');

        // --- Create Movies ---
        console.log('[importData] Creating Movies...');
        const moviesToSeed = sampleMoviesData(adminUser._id);
        const createdMovies = await Movie.insertMany(moviesToSeed);
        console.log(`[importData] Created ${createdMovies.length} movies.`);

        // --- Create Venues ---
        console.log('[importData] Creating Venues...');
        const venuesToSeed = sampleVenuesData(organizer1._id, organizer2._id, organizer3._id);
        const createdVenues = await Venue.insertMany(venuesToSeed);
        console.log(`[importData] Created ${createdVenues.length} venues.`);

        // --- Create Events ---
        console.log('[importData] Creating Events...');
        const eventsToSeed = sampleEventsData(organizer1._id, organizer2._id);
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

        // --- Create Default Settings ---
        console.log('[importData] Creating Default Settings...');
        await Setting.create({
            name: 'GST_RATE',
            value: DEFAULT_GST_RATE,
            description: 'Global Goods and Services Tax rate (percentage)'
        });
        console.log(`[importData] Default GST_RATE (${DEFAULT_GST_RATE}%) setting created.`);


        // --- Create Showtimes for NUM_DAYS_FOR_SHOWTIMES days ---
        console.log(`[importData] Creating Showtimes for ${NUM_DAYS_FOR_SHOWTIMES} days...`);
        const showtimesToCreateFinal = [];
        const startDay = new Date();
        startDay.setHours(0, 0, 0, 0);

        for (let i = 0; i < NUM_DAYS_FOR_SHOWTIMES; i++) {
            const currentDay = new Date(startDay);
            currentDay.setDate(startDay.getDate() + i);
            const currentDayStr = currentDay.toISOString().split('T')[0];

            const movieTimeSlots = ['10:00:00Z', '13:00:00Z', '16:00:00Z', '19:00:00Z', '22:00:00Z'];
            const eventTimeSlots = ['11:00:00Z', '15:00:00Z', '18:00:00Z'];

            createdVenues.forEach(venue => {
                venue.screens.forEach(screen => {
                    const movieForScreen = getRandomElement(createdMovies);
                    const eventForScreen = getRandomElement(createdEvents);

                    // Generate Movie Showtimes for this specific screen
                    movieTimeSlots.forEach(timeSlot => {
                        const startTime = new Date(`${currentDayStr}T${timeSlot}`);
                        if (startTime.getTime() > (Date.now() - (3 * 24 * 60 * 60 * 1000))) {
                            showtimesToCreateFinal.push({
                                movie: movieForScreen._id,
                                venue: venue._id,
                                screenId: screen._id,
                                startTime: startTime,
                                defaultBasePrice: BASE_TICKET_PRICE + getRandomInt(-20, 20)
                            });
                        }
                    });

                    // Generate Event Showtimes for this specific screen (if venue/screen is suitable for events)
                    if (venue.name.includes('Forum') || venue.name.includes('Central')) {
                        eventTimeSlots.forEach(timeSlot => {
                            const startTime = new Date(`${currentDayStr}T${timeSlot}`);
                            const eventStartDateOnly = new Date(eventForScreen.startDate).setHours(0,0,0,0);
                            const eventEndDateOnly = eventForScreen.endDate ? new Date(eventForScreen.endDate).setHours(23,59,59,999) : eventStartDateOnly;
                            
                            if (currentDay.getTime() >= eventStartDateOnly && currentDay.getTime() <= eventEndDateOnly) {
                                showtimesToCreateFinal.push({
                                    event: eventForScreen._id,
                                    venue: venue._id,
                                    screenId: screen._id,
                                    startTime: startTime,
                                    defaultBasePrice: BASE_TICKET_PRICE * 1.2 + getRandomInt(-10, 10)
                                });
                            }
                        });
                    }
                });
            });
        }

        let createdShowtimeCount = 0;
        for (const baseShowtimeData of showtimesToCreateFinal) {
            try {
                const associatedMovie = baseShowtimeData.movie ? createdMovies.find(m => m._id.equals(baseShowtimeData.movie)) : null;
                const associatedEvent = baseShowtimeData.event ? createdEvents.find(e => e._id.equals(baseShowtimeData.event)) : null;
                const venueDoc = createdVenues.find(v => v._id.equals(baseShowtimeData.venue));
                const screenDoc = venueDoc?.screens.id(baseShowtimeData.screenId);

                if (!venueDoc || !screenDoc || (!associatedMovie && !associatedEvent)) {
                    console.warn(`Skipping showtime creation due to missing refs after preparation (should not happen if logic is correct): Venue=${!!venueDoc}, Screen=${!!screenDoc}, Movie/Event=${!!associatedMovie || !!associatedEvent} for data:`, baseShowtimeData);
                    continue;
                }

                let durationMs;
                if (associatedMovie) {
                    durationMs = associatedMovie.duration * 60 * 1000;
                } else if (associatedEvent) {
                    durationMs = 120 * 60 * 1000;
                    if (associatedEvent.endDate && baseShowtimeData.startTime.getTime() + durationMs > associatedEvent.endDate.getTime()) {
                        durationMs = associatedEvent.endDate.getTime() - baseShowtimeData.startTime.getTime();
                        if (durationMs < 30 * 60 * 1000) durationMs = 30 * 60 * 1000;
                    }
                } else {
                    console.warn(`Showtime data missing movie/event reference during final creation, skipping:`, baseShowtimeData);
                    continue;
                }

                const startTimeMs = baseShowtimeData.startTime.getTime();
                const bufferMs = 15 * 60 * 1000;

                const seatTypesInLayout = new Set();
                if (screenDoc.seatLayout && screenDoc.seatLayout.rows) {
                    screenDoc.seatLayout.rows.forEach(row => {
                        if (row.seats) {
                            row.seats.forEach(seat => {
                                seatTypesInLayout.add(seat.type || 'Normal');
                            });
                        }
                    });
                } else {
                    seatTypesInLayout.add('Normal');
                }

                const priceTiersForShowtime = Array.from(seatTypesInLayout)
                    .filter(type => type !== 'Unavailable')
                    .map(type => {
                        let price = baseShowtimeData.defaultBasePrice;
                        switch (type.toLowerCase()) {
                            case 'vip':
                                price = price * 2.0;
                                break;
                            case 'premium':
                            case 'recliner':
                            case 'luxury':
                                price = price * 1.5;
                                break;
                            case 'wheelchair':
                                break;
                            default:
                                break;
                        }
                        return { seatType: type, price: Math.round(price * 100) / 100 };
                    });

                if (priceTiersForShowtime.length === 0) {
                    priceTiersForShowtime.push({ seatType: 'Normal', price: baseShowtimeData.defaultBasePrice });
                }
                
                const finalShowtimeData = {
                    movie: baseShowtimeData.movie,
                    event: baseShowtimeData.event,
                    venue: baseShowtimeData.venue,
                    screenId: screenDoc._id,
                    screenName: screenDoc.name,
                    startTime: baseShowtimeData.startTime,
                    endTime: new Date(startTimeMs + durationMs + bufferMs),
                    totalSeats: screenDoc.capacity,
                    bookedSeats: [],
                    isActive: true,
                    priceTiers: priceTiersForShowtime
                };

                await Showtime.create(finalShowtimeData);
                createdShowtimeCount++;
            } catch(showtimeError) {
                console.error(`Error creating individual showtime: ${showtimeError.message} for base data:`, baseShowtimeData);
            }
        }
        console.log(`[importData] Created ${createdShowtimeCount} showtimes.`);

        // --- Create Reviews for some movies ---
        console.log('[importData] Creating Reviews...');
        const movieKalki = createdMovies.find(m => m.title.includes('Kalki'));
        const movieInside = createdMovies.find(m => m.title.includes('Inside Out'));
        const movieDune = createdMovies.find(m => m.title.includes('Dune'));
        const movieInterstellar = createdMovies.find(m => m.title.includes('Interstellar'));

        if (movieKalki && regularUser1) await Review.create({ rating: 5, comment: 'Mind blowing! A true cinematic experience.', user: regularUser1._id, movie: movieKalki._id });
        if (movieInside && regularUser2) await Review.create({ rating: 4, comment: 'Very sweet movie, fun for the whole family.', user: regularUser2._id, movie: movieInside._id });
        if (movieDune && regularUser1) await Review.create({ rating: 4.5, comment: 'Visually stunning, deep storyline.', user: regularUser1._id, movie: movieDune._id });
        if (movieInterstellar && regularUser2) await Review.create({ rating: 5, comment: 'A masterpiece, makes you think!', user: regularUser2._id, movie: movieInterstellar._id });
        console.log(`[importData] Created sample reviews.`);

        
        console.log(`[importData] Created sample reviews.`);

// ✅ NEW: Update average ratings before disconnecting DB
const updateRatingStats = async (movie) => {
    try {
        const reviews = await Review.find({ movie: movie._id });
        if (!reviews.length) return;
        const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        movie.averageRating = Math.round(average * 10) / 10;
        movie.numberOfReviews = reviews.length;
        await movie.save();
        console.log(`Updated movie ${movie._id} rating stats:`, {
            _id: movie._id,
            numberOfReviews: movie.numberOfReviews,
            averageRating: movie.averageRating
        });
    } catch (err) {
        console.error(`Error updating movie rating stats for ${movie._id}:`, err);
    }
};

await Promise.all([
    movieKalki && updateRatingStats(movieKalki),
    movieInside && updateRatingStats(movieInside),
    movieDune && updateRatingStats(movieDune),
    movieInterstellar && updateRatingStats(movieInterstellar)
]);

        

        console.log('-------------------------');
        console.log('[importData] Data Seeded Successfully!');
        console.log('Sample Login Credentials:');
        console.log(`  Admin: ${adminUser.email} / ${process.env.DEFAULT_ADMIN_PASSWORD}`);
        console.log(`  Organizer 1 (INOX): ${organizer1.email} / ${COMMON_USER_PASSWORD}`);
        console.log(`  Organizer 2 (Cinepolis): ${organizer2.email} / ${COMMON_USER_PASSWORD}`);
        console.log(`  Organizer 3 (PVR): ${organizer3.email} / ${COMMON_USER_PASSWORD}`);
        console.log(`  User 1: ${regularUser1.email} / ${COMMON_USER_PASSWORD}`);
        console.log(`  User 2: ${regularUser2.email} / ${COMMON_USER_PASSWORD}`);
        console.log(`  Pending Organizer: org.pending@example.com / ${COMMON_USER_PASSWORD}`);
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
        await Showtime.deleteMany();
        await Event.deleteMany();
        await Movie.deleteMany();
        await Venue.deleteMany();
        await User.deleteMany();
        await PromoCode.deleteMany();
        await City.deleteMany();
        await Setting.deleteMany();
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
            console.log('[run] Argument "--destroy" or "-d" found. Calling destroyData...');
            success = await destroyData();
        } else {
            console.log('[run] No "--destroy" argument found. Calling importData (default)...');
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
        process.exit(success ? 0 : 1);
    }
})();

console.log('Script definition loaded. Async run function invoked.');