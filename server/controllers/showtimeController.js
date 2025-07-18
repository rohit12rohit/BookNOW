// // server/controllers/showtimeController.js
// // Purpose: Contains logic for handling showtime-related API requests.

// const Showtime = require('../models/Showtime');
// const Movie = require('../models/Movie');
// const Venue = require('../models/Venue');
// const { validationResult } = require('express-validator');
// const mongoose = require('mongoose');
// const Event = require('../models/Event');
// const dayjs = require('dayjs');

// // --- Helper: Check if user can manage venue ---
// const checkVenueAccess = async (venueId, userId, userRole, session) => {
//     const venueQuery = Venue.findById(venueId);
//     if (session) venueQuery.session(session);
//     const venue = await venueQuery;

//     if (!venue) return { authorized: false, error: 'Venue not found for access check.', status: 404 };
//     if (userRole === 'admin' || venue.organizer.toString() === userId) {
//         return { authorized: true, venue };
//     }
//     return { authorized: false, error: 'User not authorized to manage this venue.', status: 403 };
// };


// // @desc    Get showtimes (filtered by movie, venue, date, and sorted)
// // @route   GET /api/showtimes?movieId=...&venueId=...&date=YYYY-MM-DD&sort=price_asc&limit=20&page=1
// // @access  Public
// // --- UPDATED getShowtimes function ---
// // exports.getShowtimes = async (req, res) => {
// //     // Accept eventId as well
// //     const { movieId, eventId, venueId, date, sort } = req.query;
// //     console.log('[getShowtimes] Received query params:', req.query);
// //     const query = { isActive: true };
// //     if (movieId) { /* validation */ query.movie = movieId; }
// //     if (eventId) { /* validation */ query.event = eventId; } // << Filter by eventId
// //     if (venueId) { /* validation */ query.venue = venueId; }

// //     // --- Date Filtering (keep existing logic) ---
// //      if (date) {
// //         console.log(`[getShowtimes] Processing date filter for: ${date}`); // << Log date string received
// //         try {
// //             const startDate = new Date(`${date}T00:00:00.000Z`);
// //             console.log(`[getShowtimes] Constructed startDate object:`, startDate);
// //             console.log(`[getShowtimes] Is startDate valid (isNaN check)? ${isNaN(startDate.getTime())}`);
// //             const endDate = new Date(startDate);
// //             endDate.setUTCDate(startDate.getUTCDate() + 1);
// //             query.startTime = { $gte: startDate, $lt: endDate };
// //         } catch (e) { return res.status(400).json({ msg: 'Invalid date format (YYYY-MM-DD)' }); }
// //     } else {
// //          query.startTime = { $gte: new Date() }; // Default future shows
// //     }

// //     // --- Sorting (keep existing logic) ---
// //     let sortOptions = { startTime: 1 };
// //     // ... switch(sort) logic ...

// //     // --- Pagination (keep existing logic) ---
// //     const page = parseInt(req.query.page, 10) || 1;
// //     const limit = parseInt(req.query.limit, 10) || 20;
// //     const startIndex = (page - 1) * limit;
// //     const endIndex = page * limit;

// //     try {
// //          const total = await Showtime.countDocuments(query);

// //         const showtimes = await Showtime.find(query)
// //             // Populate BOTH movie and event - only one will be non-null per doc
// //             .populate('movie', 'title duration posterUrl averageRating')
// //             .populate('event', 'title category imageUrl') // << Populate event details
// //             .populate('venue', 'name address.city')
// //             .sort(sortOptions)
// //             .skip(startIndex)
// //             .limit(limit);

// //         const pagination = {};
// //         if (endIndex < total) pagination.next = { page: page + 1, limit };
// //         if (startIndex > 0) pagination.prev = { page: page - 1, limit };

// //         res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: showtimes });

// //     } catch (err) {
// //         console.error('Error fetching showtimes:', err.message);
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// // server/controllers/showtimeController.js -> getShowtimes function

// exports.getShowtimes = async (req, res) => {
//     const { movieId, eventId, venueId, date, sort } = req.query;
//     console.log('[getShowtimes] Received query params:', req.query); // << Log received params

//     const query = { isActive: true };
//     if (movieId) { /* validation */ query.movie = movieId; }
//     if (eventId) { /* validation */ query.event = eventId; }
//     if (venueId) { /* validation */ query.venue = venueId; }

//     if (date) {
//         console.log(`[getShowtimes] Processing date filter for: ${date}`); // << Log date string received
//         try {
//             const dateStringForConstructor = `${date}T00:00:00.000Z`;
//             console.log(`[getShowtimes] Date string for constructor: ${dateStringForConstructor}`); // << Log exact string for Date()
//             const startDate = new Date(dateStringForConstructor);
//             // --- ADD VALIDITY CHECK LOGS ---
//             console.log(`[getShowtimes] Constructed startDate object:`, startDate);
//             console.log(`[getShowtimes] Is startDate valid (isNaN check)? ${isNaN(startDate.getTime())}`);
//             // --- END ADDED LOGS ---

//             // If the date object is invalid, throw an error before using it
//             if (isNaN(startDate.getTime())) {
//                  throw new Error(`Constructed date object is invalid from input: ${date}`);
//             }

//             const endDate = new Date(startDate);
//             endDate.setUTCDate(startDate.getUTCDate() + 1);
//             query.startTime = { $gte: startDate, $lt: endDate };

//         } catch (e) {
//              console.error(`[getShowtimes] Error processing date '${date}':`, e.message); // Log the error
//              return res.status(400).json({ msg: `Invalid date format or processing error for ${date}. Use YYYY-MM-DD.` });
//         }
//     } else {
//          query.startTime = { $gte: new Date() };
//          console.log('[getShowtimes] No date provided, filtering for future shows from:', query.startTime.$gte);
//     }

//     // ... (rest of the function: sorting, pagination, find, response) ...
//     // ... Make sure this part is also inside a try/catch block ...
//     try {
//          let sortOptions = { startTime: 1 };
//          // ... handle sort ...
//          const page = parseInt(req.query.page, 10) || 1;
//          const limit = parseInt(req.query.limit, 10) || 20;
//          const startIndex = (page - 1) * limit;
//          const endIndex = page * limit;
//          const total = await Showtime.countDocuments(query);

//          console.log(`[getShowtimes] Executing DB query with query: ${JSON.stringify(query)}, sort: ${JSON.stringify(sortOptions)}`); // Log the final query
//          const showtimes = await Showtime.find(query)
//             .populate('movie', 'title duration posterUrl averageRating')
//            // .populate('event', 'title category imageUrl')
//             .populate('venue', 'name address.city')
//             .sort(sortOptions)
//             .skip(startIndex)
//             .limit(limit);

//           // ... handle pagination response ...
//           const pagination = {};
//           if (endIndex < total) pagination.next = { page: page + 1, limit };
//           if (startIndex > 0) pagination.prev = { page: page - 1, limit };
//           res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: showtimes });

//     } catch (err) {
//          console.error('[getShowtimes] Error executing Showtime query:', err); // Log DB query errors
//          res.status(500).json({ msg: 'Server error during showtime query' });
//     }
// };


// // @desc    Get a single showtime by ID
// // @route   GET /api/showtimes/:id
// // @access  Public
// // exports.getShowtimeById = async (req, res) => {
// //     // ...
// //     // if (showtime) {
// //     //     // If you were to format dates here for the response:
// //     //     // const responseShowtime = { ...showtime.toObject(), formattedStartTime: dayjs(showtime.startTime).format(...) };
// //     //     // res.status(200).json(responseShowtime);
// //     //     res.status(200).json(showtime); // Currently sending mongoose doc
// //     // }
// //     // ...
// //     // For now, assuming dayjs was primarily for the createShowtime calculations.
// //     try {
// //         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
// //             return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
// //         }

// //         const showtime = await Showtime.findOne({ _id: req.params.id /*, isActive: true */ }) // Admin/Organizer might see inactive
// //             .populate('movie') 
// //             .populate({ 
// //                 path: 'venue',
// //                 populate: { path: 'organizer', select: 'organizationName name' }
// //              });

// //         if (!showtime) {
// //             return res.status(404).json({ msg: 'Showtime not found or is inactive' });
// //         }

// //         res.status(200).json(showtime);
// //     } catch (err) {
// //         console.error('Error fetching showtime by ID:', err.message);
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// exports.getShowtimeById = async (req, res) => {
//     try {
//         if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//             return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
//         }
//         // Ensure priceTiers is selected. By default, all schema paths are selected.
//         const showtime = await Showtime.findById(req.params.id)
//             .populate('movie', 'title posterUrl duration description movieLanguage genre cast censorRating format')
//             .populate('event', 'title category startDate imageUrl')
//             .populate({ 
//                 path: 'venue',
//                 select: 'name address screens facilities', // Include screens for layout reference
//                 populate: { path: 'organizer', select: 'organizationName name' }
//              });

//         if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });
        
//         console.log("[getShowtimeById] Fetched Showtime with priceTiers:", showtime.priceTiers);
//         res.status(200).json(showtime);
//     } catch (err) {
//         console.error('Error fetching showtime by ID:', err.message);
//         res.status(500).json({ msg: 'Server error fetching showtime', error: err.message });
//     }
// };



// // @desc    Create a new showtime
// // @route   POST /api/showtimes
// // @access  Private (Admin or Owning Organizer)
// // --- UPDATED createShowtime function ---
// // exports.createShowtime = async (req, res) => {
// //     console.log('[createShowtime] Received request:', req.body);

// //     const { movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId, startTime, price, isActive } = req.body;
// //     const userId = req.user.id;
// //     const userRole = req.user.role;

// //     const session = await mongoose.startSession();

// //     try {
// //         session.startTransaction();
// //         console.log('[createShowtime] Transaction started.');

// //         const venueAccess = await checkVenueAccess(venueId, userId, userRole, session);
// //         // ... (venue and screen checks as before, aborting transaction on failure)
// //         if (!venueAccess.authorized) {
// //             await session.abortTransaction();
// //             // session.endSession(); // Moved to finally
// //             console.log(`[createShowtime] Venue access denied: ${venueAccess.error}`);
// //             return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
// //         }
// //         const targetVenue = venueAccess.venue;
// //         if (!targetVenue || !targetVenue.screens || targetVenue.screens.length === 0) {
// //             await session.abortTransaction(); /*session.endSession();*/ return res.status(404).json({ msg: 'Venue not found or has no screens.' });
// //         }
// //         const targetScreen = targetVenue.screens.id(screenId);
// //         if (!targetScreen) {
// //             await session.abortTransaction(); /*session.endSession();*/ return res.status(404).json({ msg: 'Screen not found.' });
// //         }
// //         console.log(`[createShowtime] Found Screen: ${targetScreen.name} with capacity ${targetScreen.capacity}`);


// //         let calculatedEndTime;
// //         const parsedStartTime = dayjs(startTime).toDate();
// //         const startTimeMs = dayjs(startTime).valueOf();
// //         const bufferMs = 15 * 60 * 1000;
// //         let movieRefForShowtime = undefined;
// //         let eventRefForShowtime = undefined;

// //         if (movieIdFromReq) {
// //             const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
// //             if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
// //                 await session.abortTransaction(); /*session.endSession();*/
// //                 const reason = !targetMovie ? "not found" : "invalid duration";
// //                 console.log(`[createShowtime] Movie ID ${movieIdFromReq} ${reason}.`);
// //                 return res.status(400).json({ msg: `Movie not found or has invalid duration.` });
// //             }
// //             calculatedEndTime = new Date(startTimeMs + (targetMovie.duration * 60000) + bufferMs);
// //             movieRefForShowtime = movieIdFromReq;
// //             console.log(`[createShowtime] Movie: ${targetMovie.title}, EndTime: ${calculatedEndTime}`);
// //         } else if (eventIdFromReq) {
// //             const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
// //              if (!targetEvent) {
// //                 await session.abortTransaction(); /*session.endSession();*/
// //                 return res.status(404).json({ msg: `Event with ID ${eventIdFromReq} not found.` });
// //             }
// //             calculatedEndTime = targetEvent.endDate ? dayjs(targetEvent.endDate).toDate() : new Date(startTimeMs + (120 * 60000) + bufferMs); // Default 2hr + buffer
// //             eventRefForShowtime = eventIdFromReq;
// //             console.log(`[createShowtime] Event: ${targetEvent.title}, EndTime: ${calculatedEndTime}`);
// //         }
        
// //         if (!calculatedEndTime && (movieIdFromReq || eventIdFromReq)) {
// //              await session.abortTransaction(); /*session.endSession();*/
// //              return res.status(500).json({ msg: 'Internal error: Could not determine item duration/endTime.' });
// //         }

// //         const newShowtimeData = {
// //             movie: movieRefForShowtime,
// //             event: eventRefForShowtime,
// //             venue: venueId, screenId, screenName: targetScreen.name,
// //             startTime: parsedStartTime, endTime: calculatedEndTime,
// //             totalSeats: targetScreen.capacity, price: parseFloat(price),
// //             bookedSeats: [], isActive: isActive !== undefined ? isActive : true,
// //         };
// //         console.log('[createShowtime] Prepared newShowtimeData (final):', newShowtimeData);

// //         // Overlap Check
// //         const existingShowtime = await Showtime.findOne({
// //             venue: venueId, screenId: screenId,
// //             $or: [ { startTime: { $lt: newShowtimeData.endTime }, endTime: { $gt: newShowtimeData.startTime } } ]
// //         }).session(session);

// //         if (existingShowtime) {
// //             await session.abortTransaction(); /*session.endSession();*/
// //             // ... (overlap error response as before)
// //             const existingStartTimeFormatted = dayjs(existingShowtime.startTime).format('h:mm A');
// //             const existingEndTimeFormatted = dayjs(existingShowtime.endTime).format('h:mm A');
// //             return res.status(409).json({ msg: `This showtime overlaps with an existing showtime on screen "${targetScreen.name}" from ${existingStartTimeFormatted} to ${existingEndTimeFormatted}.`});
// //         }
// //         console.log('[createShowtime] No overlap detected.');

// //         const showtime = new Showtime(newShowtimeData);
// //         await showtime.save({ session: session });
// //         console.log('[createShowtime] Showtime saved successfully with ID:', showtime._id);

// //         await session.commitTransaction();
// //         console.log('[createShowtime] Transaction committed.');

// //         // Populate for response - this happens AFTER commit, so no session needed for these reads
// //         let query = Showtime.findById(showtime._id)
// //             .populate('venue', 'name');
// //         if (showtime.movie) {
// //             query = query.populate('movie', 'title duration');
// //         } else if (showtime.event) {
// //             query = query.populate('event', 'title'); // Adjust fields as needed
// //         }
// //         const populatedShowtimeResponse = await query.exec();

// //         if (!populatedShowtimeResponse) {
// //              console.error(`[createShowtime] CRITICAL: Failed to re-fetch populated showtime for ID: ${showtime._id} after successful save and commit.`);
// //              // Send 201 but with unpopulated data or a specific message
// //              return res.status(201).json({ 
// //                  msg: "Showtime created, but error retrieving full details for response. Please check manually.", 
// //                  showtimeId: showtime._id 
// //              });
// //         }
// //         console.log('[createShowtime] Successfully populated showtime for response:', populatedShowtimeResponse);
// //         res.status(201).json(populatedShowtimeResponse);

// //     } catch (err) {
// //         if (session.inTransaction()) {
// //             console.log('[createShowtime] Aborting transaction due to error in main catch block.');
// //             await session.abortTransaction();
// //         }
// //         console.error('[createShowtime] Error caught in controller:', err); 
// //         if (err.name === 'ValidationError') {
// //             const messages = Object.values(err.errors).map(e => e.message);
// //             return res.status(400).json({ errors: messages });
// //         }
// //         res.status(500).json({ msg: 'Server error creating showtime', error: err.message, path: err.path });
// //     } finally {
// //        if (session) { // Ensure session was started before trying to end it
// //            await session.endSession();
// //            console.log('[createShowtime] Session ended.');
// //        }
// //     }
// // };

// // exports.createShowtime = async (req, res) => {
// //     console.log('[createShowtime] Received request body:', req.body);

// //     // Destructure all expected fields, including priceTiers
// //     const { 
// //         movie: movieIdFromReq, 
// //         event: eventIdFromReq, 
// //         venue: venueId, 
// //         screenId, 
// //         startTime, 
// //         priceTiers: priceTiersFromReqBody, // Renamed for clarity from req.body
// //         isActive 
// //     } = req.body;

// //     const userId = req.user.id;
// //     const userRole = req.user.role;

// //     const session = await mongoose.startSession();

// //     try {
// //         session.startTransaction();
// //         console.log('[createShowtime] Transaction started.');

// //         // Validate that priceTiers is present and is an array with items (can also be done by express-validator)
// //         if (!Array.isArray(rawPriceTiers) || rawPriceTiers.length === 0) {
// //             await session.abortTransaction();
// //             console.log('[createShowtime] Validation failed: priceTiers is missing or empty.');
// //             return res.status(400).json({ errors: [{ msg: 'Price tiers are required and cannot be empty.' }] });
// //         }
// //         // Further validation for content of priceTiers (seatType string, price number)
// //         // This should ideally be handled by express-validator, but a check here is also good.
// //         for (const tier of rawPriceTiers) {
// //             if (typeof tier.seatType !== 'string' || tier.seatType.trim() === '' || typeof tier.price !== 'number' || tier.price < 0) {
// //                 await session.abortTransaction();
// //                 console.log('[createShowtime] Validation failed: Invalid content in priceTiers.', tier);
// //                 return res.status(400).json({ errors: [{ msg: 'Each price tier must have a valid seatType (string) and a non-negative price (number).' }] });
// //             }
// //         }


// //         const venueAccess = await checkVenueAccess(venueId, userId, userRole, session);
// //         if (!venueAccess.authorized) {
// //             await session.abortTransaction();
// //             console.log(`[createShowtime] Venue access denied: ${venueAccess.error}`);
// //             return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
// //         }
// //         const targetVenue = venueAccess.venue;
// //         if (!targetVenue || !targetVenue.screens || targetVenue.screens.length === 0) {
// //             await session.abortTransaction(); return res.status(404).json({ msg: 'Venue not found or has no screens.' });
// //         }
// //         const targetScreen = targetVenue.screens.id(screenId);
// //         if (!targetScreen) {
// //             await session.abortTransaction(); return res.status(404).json({ msg: 'Screen not found.' });
// //         }
// //         console.log(`[createShowtime] Found Screen: ${targetScreen.name} with capacity ${targetScreen.capacity}`);

// //         let calculatedEndTime;
// //         const parsedStartTime = dayjs(startTime).toDate();
// //         const startTimeMs = dayjs(startTime).valueOf();
// //         const bufferMs = 15 * 60 * 1000;
// //         let movieRefForShowtime = undefined;
// //         let eventRefForShowtime = undefined;

// //         if (movieIdFromReq) {
// //             const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
// //             if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
// //                 await session.abortTransaction();
// //                 const reason = !targetMovie ? "not found" : "invalid duration";
// //                 console.log(`[createShowtime] Movie ID ${movieIdFromReq} ${reason}.`);
// //                 return res.status(400).json({ msg: `Movie not found or has invalid duration.` });
// //             }
// //             calculatedEndTime = new Date(startTimeMs + (targetMovie.duration * 60000) + bufferMs);
// //             movieRefForShowtime = movieIdFromReq;
// //             console.log(`[createShowtime] Movie: ${targetMovie.title}, EndTime: ${calculatedEndTime}`);
// //         } else if (eventIdFromReq) {
// //             const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
// //              if (!targetEvent) {
// //                 await session.abortTransaction();
// //                 return res.status(404).json({ msg: `Event with ID ${eventIdFromReq} not found.` });
// //             }
// //             calculatedEndTime = targetEvent.endDate ? dayjs(targetEvent.endDate).toDate() : new Date(startTimeMs + (120 * 60000) + bufferMs);
// //             eventRefForShowtime = eventIdFromReq;
// //             console.log(`[createShowtime] Event: ${targetEvent.title}, EndTime: ${calculatedEndTime}`);
// //         }
        
// //         if (!calculatedEndTime && (movieIdFromReq || eventIdFromReq)) {
// //              await session.abortTransaction();
// //              return res.status(500).json({ msg: 'Internal error: Could not determine item duration/endTime.' });
// //         }

// //         const newShowtimeData = {
// //         movie: movieRefForShowtime,
// //         event: eventRefForShowtime,
// //         venue: venueId,
// //         screenId: screenId,
// //         screenName: targetScreen.name,
// //         startTime: parsedStartTime,
// //         endTime: calculatedEndTime,
// //         totalSeats: targetScreen.capacity,
// //         priceTiers: priceTiersFromReqBody, // <<< USE THE CORRECT VARIABLE FROM req.body
// //         bookedSeats: [],
// //         isActive: isActive !== undefined ? isActive : true,
// //     };
// //     console.log('[createShowtime] Prepared newShowtimeData (final for model):', newShowtimeData);


// //         // Overlap Check (as before)
// //         const existingShowtime = await Showtime.findOne({ /* ... overlap query ... */ }).session(session);
// //         if (existingShowtime) { /* ... abort and respond ... */ }
// //         console.log('[createShowtime] No overlap detected.');

// //         const showtime = new Showtime(newShowtimeData);
// //         await showtime.save({ session: session }); // Mongoose schema validation for priceTiers runs here
// //         console.log('[createShowtime] Showtime saved successfully with ID:', showtime._id);

// //         await session.commitTransaction();
// //         console.log('[createShowtime] Transaction committed.');

// //         // Populate for response
// //         let query = Showtime.findById(showtime._id).populate('venue', 'name');
// //         if (showtime.movie) query = query.populate('movie', 'title duration');
// //         else if (showtime.event) query = query.populate('event', 'title');
// //         const populatedShowtimeResponse = await query.exec();

// //         if (!populatedShowtimeResponse) { /* ... handle error ... */ }
// //         res.status(201).json(populatedShowtimeResponse);

// //     } catch (err) {
// //         if (session.inTransaction()) {
// //             console.log('[createShowtime] Aborting transaction due to error in main catch block.');
// //             await session.abortTransaction();
// //         }
// //         console.error('[createShowtime] Error caught in controller:', err); 
// //         if (err.name === 'ValidationError') { // This is where the Mongoose schema validation error is caught
// //             const messages = Object.values(err.errors).map(e => e.message);
// //             console.error('[createShowtime] Mongoose Validation Error from model:', messages.join(', '));
// //             return res.status(400).json({ errors: messages }); // Send back specific messages
// //         }
// //         res.status(500).json({ msg: 'Server error creating showtime', error: err.message, path: err.path });
// //     } finally {
// //        if (session) {
// //            await session.endSession();
// //            console.log('[createShowtime] Session ended.');
// //        }
// //     }
// // };

// exports.createShowtime = async (req, res) => {
//     console.log('[createShowtime] Received request body:', req.body);
//     const {
//         movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId,
//         startTime, priceTiers: rawPriceTiers, isActive
//     } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     const session = await mongoose.startSession();
//     try {
//         session.startTransaction();
//         console.log('[createShowtime] Transaction started.');

//         const venueAccess = await checkVenueAccess(venueId, userId, userRole, session);
//         if (!venueAccess.authorized) {
//             await session.abortTransaction();
//             return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
//         }
//         const targetVenue = venueAccess.venue;
//         if (!targetVenue || !targetVenue.screens || targetVenue.screens.length === 0) {
//             await session.abortTransaction(); return res.status(404).json({ msg: 'Venue not found or has no screens.' });
//         }
//         const targetScreen = targetVenue.screens.id(screenId);
//         if (!targetScreen) {
//             await session.abortTransaction(); return res.status(404).json({ msg: 'Screen not found.' });
//         }
//         console.log(`[createShowtime] Found Screen: ${targetScreen.name} with capacity ${targetScreen.capacity}`);

//         let calculatedEndTime;
//         const parsedStartTime = dayjs(startTime).toDate();
//         const startTimeMs = dayjs(startTime).valueOf();
//         const bufferMs = 15 * 60 * 1000;
//         let movieRefForShowtime = undefined;
//         let eventRefForShowtime = undefined;

//         if (movieIdFromReq) {
//             const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
//             if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
//                 await session.abortTransaction();
//                 return res.status(400).json({ msg: `Movie not found or has invalid duration.` });
//             }
//             calculatedEndTime = new Date(startTimeMs + (targetMovie.duration * 60000) + bufferMs);
//             movieRefForShowtime = movieIdFromReq;
//             console.log(`[createShowtime] Movie: ${targetMovie.title}, EndTime: ${calculatedEndTime}`);
//         } else if (eventIdFromReq) {
//             const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
//             if (!targetEvent) {
//                 await session.abortTransaction(); return res.status(404).json({ msg: `Event not found.` });
//             }
//             calculatedEndTime = targetEvent.endDate ? dayjs(targetEvent.endDate).toDate() : new Date(startTimeMs + (120 * 60000) + bufferMs);
//             eventRefForShowtime = eventIdFromReq;
//             console.log(`[createShowtime] Event: ${targetEvent.title}, EndTime: ${calculatedEndTime}`);
//         }
//         if (!calculatedEndTime && (movieIdFromReq || eventIdFromReq)) {
//             await session.abortTransaction(); return res.status(500).json({ msg: 'Internal error: Could not determine endTime.' });
//         }

//         const newShowtimeData = {
//             movie: movieRefForShowtime, event: eventRefForShowtime, venue: venueId, screenId,
//             screenName: targetScreen.name, startTime: parsedStartTime, endTime: calculatedEndTime,
//             totalSeats: targetScreen.capacity, priceTiers: rawPriceTiers, // Use validated rawPriceTiers
//             bookedSeats: [], isActive: isActive !== undefined ? isActive : true,
//         };
//         console.log('[createShowtime] Prepared newShowtimeData for model:', newShowtimeData);

//         const existingShowtime = await Showtime.findOne({
//             venue: venueId, screenId: screenId,
//             $or: [{ startTime: { $lt: newShowtimeData.endTime }, endTime: { $gt: newShowtimeData.startTime } }]
//         }).session(session);
//         if (existingShowtime) {
//             await session.abortTransaction();
//             return res.status(409).json({ msg: `This showtime overlaps with an existing showtime on screen "${targetScreen.name}".` });
//         }
//         console.log('[createShowtime] No overlap detected.');

//         const showtime = new Showtime(newShowtimeData);
//         await showtime.save({ session: session });
//         console.log('[createShowtime] Showtime saved successfully with ID:', showtime._id);

//         await session.commitTransaction();
//         console.log('[createShowtime] Transaction committed.');

//         let query = Showtime.findById(showtime._id).populate('venue', 'name');
//         if (showtime.movie) query = query.populate('movie', 'title duration');
//         else if (showtime.event) query = query.populate('event', 'title');
//         const populatedShowtimeResponse = await query.exec();

//         if (!populatedShowtimeResponse) return res.status(404).json({ msg: "Showtime created but couldn't be retrieved." });
//         res.status(201).json(populatedShowtimeResponse);
//     } catch (err) {
//         if (session.inTransaction()) await session.abortTransaction();
//         console.error('[createShowtime] Error caught:', err);
//         if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
//         res.status(500).json({ msg: 'Server error creating showtime', error: err.message, path: err.path });
//     } finally {
//         if (session) await session.endSession();
//         console.log('[createShowtime] Session ended.');
//     }
// };



// // @desc    Update a showtime
// // @route   PUT /api/showtimes/:id
// // @access  Private (Admin or Owning Organizer)
// // exports.updateShowtime = async (req, res) => {
// //      const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //         return res.status(400).json({ errors: errors.array() });
// //     }

// //     const showtimeId = req.params.id;
// //     const { startTime, price, isActive } = req.body; // Only allow updating certain fields?
// //     const userId = req.user.id;
// //     const userRole = req.user.role;

// //     try {
// //         let showtime = await Showtime.findById(showtimeId);
// //         if (!showtime) {
// //             return res.status(404).json({ msg: 'Showtime not found' });
// //         }

// //         // 1. Check if user is authorized for the venue associated with this showtime
// //         const access = await checkVenueAccess(showtime.venue, userId, userRole);
// //         if (!access.authorized) {
// //             return res.status(access.status).json({ msg: access.error });
// //         }

// //         // TODO: Add check - Can showtime be updated if bookings already exist? Maybe only price/isActive?

// //         // Prepare fields to update
// //         const updatedFields = {};
// //         if (startTime) updatedFields.startTime = startTime;
// //         if (price !== undefined) updatedFields.price = price;
// //         if (typeof isActive === 'boolean') updatedFields.isActive = isActive;

// //         // If startTime is updated, the pre-save hook should recalculate endTime
// //         // If changing movie/screen, need more complex update logic + recalculations

// //         // Perform update
// //         const updatedShowtime = await Showtime.findByIdAndUpdate(
// //             showtimeId,
// //             { $set: updatedFields },
// //             { new: true, runValidators: true } // Return updated, run validators (and pre-save)
// //         ).populate('movie', 'title').populate('venue', 'name');


// //         res.status(200).json(updatedShowtime);

// //     } catch (err) {
// //         console.error('Error updating showtime:', err.message);
// //          if (err.kind === 'ObjectId') {
// //              return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
// //         }
// //         res.status(500).json({ msg: `Server error: ${err.message}` });
// //     }
// // };

// exports.updateShowtime = async (req, res) => {
//     const showtimeId = req.params.id;
//     const { 
//         movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId, 
//         startTime, priceTiers: rawPriceTiers, isActive 
//     } = req.body;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     const session = await mongoose.startSession();
//     try {
//         session.startTransaction();
//         console.log(`[updateShowtime] Transaction started for ${showtimeId}`);

//         const showtimeToUpdate = await Showtime.findById(showtimeId).session(session);
//         if (!showtimeToUpdate) {
//             await session.abortTransaction(); return res.status(404).json({ msg: 'Showtime not found' });
//         }

//         const venueAccess = await checkVenueAccess(showtimeToUpdate.venue.toString(), userId, userRole, session);
//         if (!venueAccess.authorized) {
//             await session.abortTransaction(); return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
//         }
        
//         const updateFields = {};
//         let requiresRecalculation = false;
//         let newTargetScreen = null;
//         let newTargetVenue = null;

//         // Handle venue & screen changes first as they affect screenName, totalSeats
//         if (venueId && venueId !== showtimeToUpdate.venue.toString()) {
//             const newVenueAccessCheck = await checkVenueAccess(venueId, userId, userRole, session); // Check access for new venue
//             if (!newVenueAccessCheck.authorized) {
//                 await session.abortTransaction(); return res.status(newVenueAccessCheck.status || 403).json({ msg: newVenueAccessCheck.error });
//             }
//             newTargetVenue = newVenueAccessCheck.venue;
//             updateFields.venue = venueId;
//             requiresRecalculation = true; 
//             // Screen must be re-selected if venue changes
//             if (!screenId) { await session.abortTransaction(); return res.status(400).json({msg: "ScreenId is required when changing venue."}); }
//         }
//         const currentVenueForScreen = newTargetVenue || venueAccess.venue; // venue for screen lookup

//         if (screenId && screenId !== showtimeToUpdate.screenId.toString()) {
//             if (!currentVenueForScreen || !currentVenueForScreen.screens) {
//                  await session.abortTransaction(); return res.status(404).json({ msg: 'Venue details for screen selection not found.' });
//             }
//             newTargetScreen = currentVenueForScreen.screens.id(screenId);
//             if (!newTargetScreen) {
//                 await session.abortTransaction(); return res.status(404).json({ msg: 'New screen not found in the specified venue.' });
//             }
//             updateFields.screenId = screenId;
//             updateFields.screenName = newTargetScreen.name;
//             updateFields.totalSeats = newTargetScreen.capacity;
//             requiresRecalculation = true;
//         }

//         // Use the potentially updated screen/venue for further logic
//         const finalTargetScreen = newTargetScreen || currentVenueForScreen.screens.id(showtimeToUpdate.screenId);


//         if (movieIdFromReq && movieIdFromReq !== showtimeToUpdate.movie?.toString()) {
//             const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
//             if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
//                 await session.abortTransaction(); return res.status(400).json({ msg: 'New movie not found or has invalid duration.' });
//             }
//             updateFields.movie = movieIdFromReq;
//             updateFields.event = null; // Clear event if movie is set
//             showtimeToUpdate.movie = targetMovie; // For endTime calculation below
//             showtimeToUpdate.event = null;
//             requiresRecalculation = true;
//         } else if (movieIdFromReq === null && showtimeToUpdate.movie) { // Clearing movie
//             updateFields.movie = null;
//             requiresRecalculation = true;
//         }
        
//         if (eventIdFromReq && eventIdFromReq !== showtimeToUpdate.event?.toString()) {
//             const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
//             if (!targetEvent) { await session.abortTransaction(); return res.status(404).json({ msg: `New event not found.` });}
//             updateFields.event = eventIdFromReq;
//             updateFields.movie = null;
//             showtimeToUpdate.event = targetEvent;
//             showtimeToUpdate.movie = null;
//             requiresRecalculation = true;
//         } else if (eventIdFromReq === null && showtimeToUpdate.event) { // Clearing event
//             updateFields.event = null;
//             requiresRecalculation = true;
//         }


//         if (startTime) {
//             updateFields.startTime = dayjs(startTime).toDate();
//             requiresRecalculation = true;
//         }
//         if (rawPriceTiers) updateFields.priceTiers = rawPriceTiers; // Assume already validated by route
//         if (isActive !== undefined) updateFields.isActive = isActive;


//         if (requiresRecalculation) {
//             const currentStartTime = updateFields.startTime || showtimeToUpdate.startTime;
//             const currentStartTimeMs = dayjs(currentStartTime).valueOf();
//             const bufferMs = 15 * 60 * 1000;
            
//             // Determine which item (movie/event) to use for duration
//             const itemForDuration = updateFields.movie ? await Movie.findById(updateFields.movie).select('duration').session(session) : 
//                                     (updateFields.event === null && showtimeToUpdate.movie && !movieIdFromReq) ? await Movie.findById(showtimeToUpdate.movie).select('duration').session(session) : null; // If movie was cleared, but event not set
//             const eventForDuration = updateFields.event ? await Event.findById(updateFields.event).select('endDate').session(session) :
//                                      (updateFields.movie === null && showtimeToUpdate.event && !eventIdFromReq) ? await Event.findById(showtimeToUpdate.event).select('endDate').session(session) : null;


//             if (itemForDuration && typeof itemForDuration.duration === 'number') {
//                 updateFields.endTime = new Date(currentStartTimeMs + (itemForDuration.duration * 60000) + bufferMs);
//             } else if (eventForDuration) {
//                 updateFields.endTime = eventForDuration.endDate ? dayjs(eventForDuration.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
//             } else if ((updateFields.movie===null && !updateFields.event && !showtimeToUpdate.event) || (updateFields.event===null && !updateFields.movie && !showtimeToUpdate.movie)) {
//                 // if both become null, this should be caught by model validation. Controller should not proceed if no item is linked.
//                  await session.abortTransaction(); return res.status(400).json({ msg: 'Showtime must be linked to a movie or an event after update.' });
//             } else {
//                 // If item not changed, use existing showtime item for duration
//                 const fallbackMovie = showtimeToUpdate.movie && !updateFields.event ? await Movie.findById(showtimeToUpdate.movie._id).select('duration').session(session) : null;
//                 const fallbackEvent = showtimeToUpdate.event && !updateFields.movie ? await Event.findById(showtimeToUpdate.event._id).select('endDate').session(session) : null;
//                 if (fallbackMovie && typeof fallbackMovie.duration === 'number') {
//                      updateFields.endTime = new Date(currentStartTimeMs + (fallbackMovie.duration * 60000) + bufferMs);
//                 } else if (fallbackEvent) {
//                      updateFields.endTime = fallbackEvent.endDate ? dayjs(fallbackEvent.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
//                 } else {
//                      console.warn("[updateShowtime] Could not reliably recalculate endTime. Check item linkage.");
//                      // Retain old endTime if not recalculable and startTime not changed, or error out
//                      if(!updateFields.startTime) updateFields.endTime = showtimeToUpdate.endTime;
//                      else { await session.abortTransaction(); return res.status(400).json({msg: "Could not determine endTime after update."})}
//                 }
//             }
//         }
        
//         // Overlap check before saving (important if startTime, endTime, venue, or screen changes)
//         const checkStartTime = updateFields.startTime || showtimeToUpdate.startTime;
//         const checkEndTime = updateFields.endTime || showtimeToUpdate.endTime;
//         const checkVenue = updateFields.venue || showtimeToUpdate.venue.toString();
//         const checkScreen = updateFields.screenId || showtimeToUpdate.screenId.toString();

//         const existingOverlap = await Showtime.findOne({
//             _id: { $ne: showtimeId }, 
//             venue: checkVenue, screenId: checkScreen,
//             $or: [ { startTime: { $lt: checkEndTime }, endTime: { $gt: checkStartTime } } ]
//         }).session(session);
//         if (existingOverlap) {
//             await session.abortTransaction(); return res.status(409).json({ msg: 'Updated showtime overlaps with another showtime.' });
//         }

//         const updatedShowtime = await Showtime.findByIdAndUpdate(showtimeId, { $set: updateFields }, { new: true, runValidators: true, session: session });
//         if (!updatedShowtime) { await session.abortTransaction(); return res.status(404).json({ msg: "Showtime update failed or showtime not found." });}
        
//         await session.commitTransaction();
//         console.log(`[updateShowtime] Transaction committed for ${showtimeId}`);

//         let popQuery = Showtime.findById(updatedShowtime._id).populate('venue', 'name');
//         if (updatedShowtime.movie) popQuery = popQuery.populate('movie', 'title duration');
//         else if (updatedShowtime.event) popQuery = popQuery.populate('event', 'title');
//         const populatedResponse = await popQuery.exec();

//         res.status(200).json(populatedResponse || updatedShowtime);

//     } catch (err) {
//         if (session.inTransaction()) await session.abortTransaction();
//         console.error(`Error updating showtime ${showtimeId}:`, err);
//         if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
//         res.status(500).json({ msg: `Server error updating showtime: ${err.message}` });
//     } finally {
//         if(session) await session.endSession();
//         console.log(`[updateShowtime] Session ended for ${showtimeId}`);
//     }
// };




// // @desc    Delete a showtime (Soft delete recommended)
// // @route   DELETE /api/showtimes/:id
// // @access  Private (Admin or Owning Organizer)
// // exports.deleteShowtime = async (req, res) => {
// //     const showtimeId = req.params.id;
// //     const userId = req.user.id;
// //     const userRole = req.user.role;

// //     try {
// //         let showtime = await Showtime.findById(showtimeId);
// //         if (!showtime) {
// //             return res.status(404).json({ msg: 'Showtime not found' });
// //         }

// //         // 1. Check authorization for the venue
// //         const access = await checkVenueAccess(showtime.venue, userId, userRole);
// //         if (!access.authorized) {
// //             return res.status(access.status).json({ msg: access.error });
// //         }

// //         // 2. Check for existing bookings (Important!)
// //         if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
// //             // Option 1: Prevent deletion
// //              return res.status(400).json({ msg: 'Cannot delete showtime with existing bookings. Deactivate instead.' });
// //             // Option 2: Implement refund/notification logic (Complex)
// //             // Option 3: Proceed with deletion (Risky)
// //         }

// //         // 3. Perform delete/deactivation
// //         // --- Hard Delete ---
// //         // await showtime.remove();
// //         // res.status(200).json({ msg: 'Showtime deleted successfully' });

// //         // --- Soft Delete (Set isActive=false) ---
// //          showtime.isActive = false;
// //          await showtime.save();
// //          res.status(200).json({ msg: 'Showtime deactivated successfully' });


// //     } catch (err) {
// //         console.error('Error deleting/deactivating showtime:', err.message);
// //          if (err.kind === 'ObjectId') {
// //              return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
// //         }
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// // Delete showtime (no changes needed for tiered pricing logic itself)
// exports.deleteShowtime = async (req, res) => { /* ... existing code ... */ };

// // Get showtime seatmap (no changes needed for tiered pricing logic itself)
// exports.getShowtimeSeatmap = async (req, res) => { /* ... existing code ... */ };

// // Get all showtimes (public) - ensure it returns priceTiers
// exports.getShowtimes = async (req, res) => {
//     const { movieId, eventId, venueId, date, sort } = req.query;
//     const query = { isActive: true };
//     if (movieId) query.movie = movieId;
//     if (eventId) query.event = eventId;
//     if (venueId) query.venue = venueId;

//     if (date) {
//         try {
//             const startDate = dayjs(date).startOf('day').toDate();
//             const endDate = dayjs(date).endOf('day').toDate();
//             query.startTime = { $gte: startDate, $lt: endDate }; // Showtimes starting on this day
//         } catch (e) { console.warn("Invalid date format for public showtime filter:", date); }
//     } else {
//          query.startTime = { $gte: dayjs().startOf('day').toDate() }; // Default to today and future shows
//     }

//     let sortOptions = { startTime: 1 };
//     if (sort === 'price_asc' && false) { /* TODO: Sorting by price is complex with tiers. Maybe sort by lowest tier? */ }

//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 20;
//     const startIndex = (page - 1) * limit;

//     try {
//         const total = await Showtime.countDocuments(query);
//         const showtimes = await Showtime.find(query)
//             .populate('movie', 'title duration posterUrl averageRating')
//             .populate('event', 'title category imageUrl')
//             .populate('venue', 'name address.city')
//             .sort(sortOptions)
//             .skip(startIndex)
//             .limit(limit)
//             .lean(); // Using lean

//         // If you need to display a representative price or price range, process here:
//         const processedShowtimes = showtimes.map(st => {
//             let displayPriceInfo = "N/A";
//             if (st.priceTiers && st.priceTiers.length > 0) {
//                 const prices = st.priceTiers.map(t => t.price);
//                 const minPrice = Math.min(...prices);
//                 const maxPrice = Math.max(...prices);
//                 if (minPrice === maxPrice) displayPriceInfo = `Rs. ${minPrice.toFixed(2)}`;
//                 else displayPriceInfo = `Rs. ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
//             }
//             return { ...st, displayPriceInfo };
//         });

//         const pagination = {};
//         if ((startIndex + limit) < total) pagination.next = { page: page + 1, limit };
//         if (startIndex > 0) pagination.prev = { page: page - 1, limit };

//         res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: processedShowtimes });
//     } catch (err) {
//         console.error('Error fetching showtimes (public):', err);
//         res.status(500).json({ msg: 'Server error fetching showtimes', error: err.message });
//     }
// };



// // @desc    Get seat map layout and booking status for a specific showtime
// // @route   GET /api/showtimes/:id/seatmap
// // @access  Public
// // exports.getShowtimeSeatmap = async (req, res) => {
// //     const showtimeId = req.params.id;

// //     try {
// //         if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
// //             return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
// //         }

// //         // 1. Find the showtime
// //         const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive'); // Select necessary fields

// //         if (!showtime || !showtime.isActive) {
// //             return res.status(404).json({ msg: 'Showtime not found or is inactive' });
// //         }

// //         // 2. Find the corresponding venue
// //         const venue = await Venue.findById(showtime.venue).select('screens'); // Select only screens array

// //         if (!venue) {
// //             return res.status(404).json({ msg: 'Venue associated with showtime not found' });
// //         }

// //         // 3. Find the specific screen within the venue's screens array
// //         const screen = venue.screens.id(showtime.screenId); // Use Mongoose's .id() subdocument helper

// //         if (!screen || !screen.seatLayout) {
// //             return res.status(404).json({ msg: 'Screen layout not found for this showtime' });
// //         }

// //         // 4. Combine Layout with Booking Status
// //         // Create a response object that merges the layout with the booked status from the showtime
// //         x

// //         res.status(200).json(seatMap);

// //     } catch (err) {
// //         console.error('Error fetching showtime seatmap:', err.message);
// //         res.status(500).json({ msg: 'Server error' });
// //     }
// // };

// exports.getShowtimeSeatmap = async (req, res) => {
//     const showtimeId = req.params.id;
//     console.log(`[getShowtimeSeatmap] Request received for ID: ${showtimeId}`); // Add log

//     try {
//         if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
//             return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
//         }

//         // 1. Find the showtime
//         console.log('[getShowtimeSeatmap] Finding showtime...');
//         const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive');
//         if (!showtime || !showtime.isActive) {
//             console.log(`[getShowtimeSeatmap] Showtime ${showtimeId} not found or inactive.`);
//             return res.status(404).json({ msg: 'Showtime not found or is inactive' });
//         }
//         console.log('[getShowtimeSeatmap] Found showtime.');

//         // 2. Find the corresponding venue
//         console.log(`[getShowtimeSeatmap] Finding venue: ${showtime.venue}`);
//         const venue = await Venue.findById(showtime.venue).select('screens name'); // Select screens and name
//         if (!venue) {
//             console.log(`[getShowtimeSeatmap] Venue ${showtime.venue} not found.`);
//             return res.status(404).json({ msg: 'Venue associated with showtime not found' });
//         }
//         console.log(`[getShowtimeSeatmap] Found venue: ${venue.name}`);

//         // 3. Find the specific screen within the venue's screens array
//         console.log(`[getShowtimeSeatmap] Finding screen: ${showtime.screenId} within venue ${venue._id}`);
//         const screen = venue.screens.id(showtime.screenId); // Use Mongoose's .id() subdocument helper
//         if (!screen || !screen.seatLayout || !Array.isArray(screen.seatLayout.rows)) { // Check seatLayout and rows array
//             console.log(`[getShowtimeSeatmap] Screen ${showtime.screenId} or its seatLayout/rows not found/valid.`);
//             return res.status(404).json({ msg: 'Screen layout not found or invalid for this showtime' });
//         }
//         console.log(`[getShowtimeSeatmap] Found screen: ${screen.name}`);

//         // 4. Combine Layout with Booking Status
//         console.log('[getShowtimeSeatmap] Constructing seat map response...');
//         // --- RESTORED seatMap object construction ---
//         const seatMap = {
//             showtimeId: showtime._id,
//             screenId: screen._id,
//             screenName: screen.name,
//             // Ensure we return the layout object containing the rows array
//             layout: {
//                 rows: screen.seatLayout.rows.map(row => ({
//                     // Ensure row and row.seats exist before processing
//                     rowId: row?.rowId || 'N/A', // Add fallback
//                     seats: Array.isArray(row?.seats) ? row.seats.map(seat => {
//                         // Ensure seat and seat.seatNumber exist
//                         if (!seat || !seat.seatNumber) return null; // Skip invalid seat data
//                         const seatIdentifier = `${row.rowId}${seat.seatNumber}`;
//                         return {
//                             seatNumber: seat.seatNumber,
//                             type: seat.type || 'Normal', // Add fallback
//                             identifier: seatIdentifier,
//                             isBooked: showtime.bookedSeats.includes(seatIdentifier)
//                         };
//                     }).filter(seat => seat !== null) : [] // Filter out null seats and handle if row.seats isn't an array
//                 }))
//             }
//         };
//         // --- END RESTORED BLOCK ---

//         console.log('[getShowtimeSeatmap] Sending seat map response.');
//         res.status(200).json(seatMap); // Send the correctly constructed seatMap

//     } catch (err) {
//         // Remove the 'x' variable if it was still there
//         console.error('Error fetching showtime seatmap:', err.message); // Log the error message
//         console.error(err.stack); // Log the stack trace for more details
//         res.status(500).json({ msg: 'Server error' });
//     }
// };


// module.exports = {
//     createShowtime: exports.createShowtime,
//     getShowtimes: exports.getShowtimes,
//     getShowtimeById: exports.getShowtimeById,
//     updateShowtime: exports.updateShowtime,
//     deleteShowtime: exports.deleteShowtime,
//     getShowtimeSeatmap: exports.getShowtimeSeatmap
// }

// File: /server/controllers/showtimeController.js
// Purpose: Contains logic for handling showtime-related API requests.

const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Venue = require('../models/Venue');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const dayjs = require('dayjs');

// --- Helper: Check if user can manage venue ---
const checkVenueAccess = async (venueId, userId, userRole, session) => {
    const venueQuery = Venue.findById(venueId);
    if (session) venueQuery.session(session);
    const venue = await venueQuery;

    if (!venue) return { authorized: false, error: 'Venue not found for access check.', status: 404 };
    if (userRole === 'admin' || venue.organizer.toString() === userId) {
        return { authorized: true, venue };
    }
    return { authorized: false, error: 'User not authorized to manage this venue.', status: 403 };
};


// @desc    Get showtimes (filtered by movie, venue, date, and sorted)
// @route   GET /api/showtimes?movieId=...&venueId=...&date=YYYY-MM-DD&sort=price_asc&limit=20&page=1
// @access  Public
exports.getShowtimes = async (req, res) => {
    const { movieId, eventId, venueId, date, sort } = req.query;
    console.log('[getShowtimes] Received query params:', req.query); // << Log received params

    const query = { isActive: true };
    if (movieId) { /* validation */ query.movie = movieId; }
    if (eventId) { /* validation */ query.event = eventId; }
    if (venueId) { /* validation */ query.venue = venueId; }

    if (date) {
        console.log(`[getShowtimes] Processing date filter for: ${date}`); // << Log date string received
        try {
            // Correctly create start and end of the day in UTC
            const startDate = dayjs(date).startOf('day').toDate();
            const endDate = dayjs(date).endOf('day').toDate();
            
            console.log(`[getShowtimes] Constructed startDate object:`, startDate);
            console.log(`[getShowtimes] Constructed endDate object:`, endDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                 throw new Error(`Constructed date object is invalid from input: ${date}`);
            }
            
            query.startTime = { $gte: startDate, $lt: endDate };

        } catch (e) {
             console.error(`[getShowtimes] Error processing date '${date}':`, e.message); // Log the error
             return res.status(400).json({ msg: `Invalid date format or processing error for ${date}. Use YYYY-MM-DD.` });
        }
    } else {
         query.startTime = { $gte: new Date() };
         console.log('[getShowtimes] No date provided, filtering for future shows from:', query.startTime.$gte);
    }

    try {
         let sortOptions = { startTime: 1 };
         // ... handle sort ...
         const page = parseInt(req.query.page, 10) || 1;
         const limit = parseInt(req.query.limit, 10) || 20;
         const startIndex = (page - 1) * limit;
         const endIndex = page * limit;
         const total = await Showtime.countDocuments(query);

         console.log(`[getShowtimes] Executing DB query with query: ${JSON.stringify(query)}, sort: ${JSON.stringify(sortOptions)}`); // Log the final query
         const showtimes = await Showtime.find(query)
            .populate('movie', 'title duration posterUrl averageRating')
           // .populate('event', 'title category imageUrl')
            .populate('venue', 'name address.city')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit);

          // ... handle pagination response ...
          const pagination = {};
          if (endIndex < total) pagination.next = { page: page + 1, limit };
          if (startIndex > 0) pagination.prev = { page: page - 1, limit };
          res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: showtimes });

    } catch (err) {
         console.error('[getShowtimes] Error executing Showtime query:', err); // Log DB query errors
         res.status(500).json({ msg: 'Server error during showtime query' });
    }
};


// @desc    Get a single showtime by ID
// @route   GET /api/showtimes/:id
// @access  Public
exports.getShowtimeById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
        }
        // Ensure priceTiers is selected. By default, all schema paths are selected.
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie', 'title posterUrl duration description movieLanguage genre cast censorRating format')
            .populate('event', 'title category startDate imageUrl')
            .populate({ 
                path: 'venue',
                select: 'name address screens facilities', // Include screens for layout reference
                populate: { path: 'organizer', select: 'organizationName name' }
             });

        if (!showtime) return res.status(404).json({ msg: 'Showtime not found' });
        
        console.log("[getShowtimeById] Fetched Showtime with priceTiers:", showtime.priceTiers);
        res.status(200).json(showtime);
    } catch (err) {
        console.error('Error fetching showtime by ID:', err.message);
        res.status(500).json({ msg: 'Server error fetching showtime', error: err.message });
    }
};



// @desc    Create a new showtime
// @route   POST /api/showtimes
// @access  Private (Admin or Owning Organizer)
exports.createShowtime = async (req, res) => {
    console.log('[createShowtime] Received request body:', req.body);
    const {
        movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId,
        startTime, priceTiers: rawPriceTiers, isActive
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log('[createShowtime] Transaction started.');

        const venueAccess = await checkVenueAccess(venueId, userId, userRole, session);
        if (!venueAccess.authorized) {
            await session.abortTransaction();
            return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
        }
        const targetVenue = venueAccess.venue;
        if (!targetVenue || !targetVenue.screens || targetVenue.screens.length === 0) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Venue not found or has no screens.' });
        }
        const targetScreen = targetVenue.screens.id(screenId);
        if (!targetScreen) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Screen not found.' });
        }
        console.log(`[createShowtime] Found Screen: ${targetScreen.name} with capacity ${targetScreen.capacity}`);

        let calculatedEndTime;
        const parsedStartTime = dayjs(startTime).toDate();
        const startTimeMs = dayjs(startTime).valueOf();
        const bufferMs = 15 * 60 * 1000;
        let movieRefForShowtime = undefined;
        let eventRefForShowtime = undefined;

        if (movieIdFromReq) {
            const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
            if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
                await session.abortTransaction();
                return res.status(400).json({ msg: `Movie not found or has invalid duration.` });
            }
            calculatedEndTime = new Date(startTimeMs + (targetMovie.duration * 60000) + bufferMs);
            movieRefForShowtime = movieIdFromReq;
            console.log(`[createShowtime] Movie: ${targetMovie.title}, EndTime: ${calculatedEndTime}`);
        } else if (eventIdFromReq) {
            const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
            if (!targetEvent) { await session.abortTransaction(); return res.status(404).json({ msg: `Event not found.` });}
            calculatedEndTime = targetEvent.endDate ? dayjs(targetEvent.endDate).toDate() : new Date(startTimeMs + (120 * 60000) + bufferMs);
            eventRefForShowtime = eventIdFromReq;
            console.log(`[createShowtime] Event: ${targetEvent.title}, EndTime: ${calculatedEndTime}`);
        }
        if (!calculatedEndTime && (movieIdFromReq || eventIdFromReq)) {
            await session.abortTransaction(); return res.status(500).json({ msg: 'Internal error: Could not determine endTime.' });
        }

        const newShowtimeData = {
            movie: movieRefForShowtime, event: eventRefForShowtime, venue: venueId, screenId,
            screenName: targetScreen.name, startTime: parsedStartTime, endTime: calculatedEndTime,
            totalSeats: targetScreen.capacity, priceTiers: rawPriceTiers, // Use validated rawPriceTiers
            bookedSeats: [], isActive: isActive !== undefined ? isActive : true,
        };
        console.log('[createShowtime] Prepared newShowtimeData for model:', newShowtimeData);

        const existingShowtime = await Showtime.findOne({
            venue: venueId, screenId: screenId,
            $or: [{ startTime: { $lt: newShowtimeData.endTime }, endTime: { $gt: newShowtimeData.startTime } }]
        }).session(session);
        if (existingShowtime) {
            await session.abortTransaction();
            return res.status(409).json({ msg: `This showtime overlaps with an existing showtime on screen "${targetScreen.name}".` });
        }
        console.log('[createShowtime] No overlap detected.');

        const showtime = new Showtime(newShowtimeData);
        await showtime.save({ session: session });
        console.log('[createShowtime] Showtime saved successfully with ID:', showtime._id);

        await session.commitTransaction();
        console.log('[createShowtime] Transaction committed.');

        let query = Showtime.findById(showtime._id).populate('venue', 'name');
        if (showtime.movie) query = query.populate('movie', 'title duration');
        else if (showtime.event) query = query.populate('event', 'title');
        const populatedShowtimeResponse = await query.exec();

        if (!populatedShowtimeResponse) return res.status(404).json({ msg: "Showtime created but couldn't be retrieved." });
        res.status(201).json(populatedShowtimeResponse);
    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error('[createShowtime] Error caught:', err);
        if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        res.status(500).json({ msg: 'Server error creating showtime', error: err.message, path: err.path });
    } finally {
        if (session) await session.endSession();
        console.log('[createShowtime] Session ended.');
    }
};



// @desc    Update a showtime
// @route   PUT /api/showtimes/:id
// @access  Private (Admin or Owning Organizer)
exports.updateShowtime = async (req, res) => {
    const showtimeId = req.params.id;
    const { 
        movie: movieIdFromReq, event: eventIdFromReq, venue: venueId, screenId, 
        startTime, priceTiers: rawPriceTiers, isActive 
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log(`[updateShowtime] Transaction started for ${showtimeId}`);

        const showtimeToUpdate = await Showtime.findById(showtimeId).session(session);
        if (!showtimeToUpdate) {
            await session.abortTransaction(); return res.status(404).json({ msg: 'Showtime not found' });
        }

        const venueAccess = await checkVenueAccess(showtimeToUpdate.venue.toString(), userId, userRole, session);
        if (!venueAccess.authorized) {
            await session.abortTransaction(); return res.status(venueAccess.status || 403).json({ msg: venueAccess.error });
        }
        
        const updateFields = {};
        let requiresRecalculation = false;
        let newTargetScreen = null;
        let newTargetVenue = null;

        // Handle venue & screen changes first as they affect screenName, totalSeats
        if (venueId && venueId !== showtimeToUpdate.venue.toString()) {
            const newVenueAccessCheck = await checkVenueAccess(venueId, userId, userRole, session); // Check access for new venue
            if (!newVenueAccessCheck.authorized) {
                await session.abortTransaction(); return res.status(newVenueAccessCheck.status || 403).json({ msg: newVenueAccessCheck.error });
            }
            newTargetVenue = newVenueAccessCheck.venue;
            updateFields.venue = venueId;
            requiresRecalculation = true; 
            // Screen must be re-selected if venue changes
            if (!screenId) { await session.abortTransaction(); return res.status(400).json({msg: "ScreenId is required when changing venue."}); }
        }
        const currentVenueForScreen = newTargetVenue || venueAccess.venue; // venue for screen lookup

        if (screenId && screenId !== showtimeToUpdate.screenId.toString()) {
            if (!currentVenueForScreen || !currentVenueForScreen.screens) {
                 await session.abortTransaction(); return res.status(404).json({ msg: 'Venue details for screen selection not found.' });
            }
            newTargetScreen = currentVenueForScreen.screens.id(screenId);
            if (!newTargetScreen) {
                await session.abortTransaction(); return res.status(404).json({ msg: 'New screen not found in the specified venue.' });
            }
            updateFields.screenId = screenId;
            updateFields.screenName = newTargetScreen.name;
            updateFields.totalSeats = newTargetScreen.capacity;
            requiresRecalculation = true;
        }

        // Use the potentially updated screen/venue for further logic
        const finalTargetScreen = newTargetScreen || currentVenueForScreen.screens.id(showtimeToUpdate.screenId);


        if (movieIdFromReq && movieIdFromReq !== showtimeToUpdate.movie?.toString()) {
            const targetMovie = await Movie.findById(movieIdFromReq).select('duration title').session(session);
            if (!targetMovie || typeof targetMovie.duration !== 'number' || targetMovie.duration <= 0) {
                await session.abortTransaction(); return res.status(400).json({ msg: 'New movie not found or has invalid duration.' });
            }
            updateFields.movie = movieIdFromReq;
            updateFields.event = null; // Clear event if movie is set
            showtimeToUpdate.movie = targetMovie; // For endTime calculation below
            showtimeToUpdate.event = null;
            requiresRecalculation = true;
        } else if (movieIdFromReq === null && showtimeToUpdate.movie) { // Clearing movie
            updateFields.movie = null;
            requiresRecalculation = true;
        }
        
        if (eventIdFromReq && eventIdFromReq !== showtimeToUpdate.event?.toString()) {
            const targetEvent = await Event.findById(eventIdFromReq).select('endDate title').session(session);
            if (!targetEvent) { await session.abortTransaction(); return res.status(404).json({ msg: `New event not found.` });}
            updateFields.event = eventIdFromReq;
            updateFields.movie = null;
            showtimeToUpdate.event = targetEvent;
            showtimeToUpdate.movie = null;
            requiresRecalculation = true;
        } else if (eventIdFromReq === null && showtimeToUpdate.event) { // Clearing event
            updateFields.event = null;
            requiresRecalculation = true;
        }


        if (startTime) {
            updateFields.startTime = dayjs(startTime).toDate();
            requiresRecalculation = true;
        }
        if (rawPriceTiers) updateFields.priceTiers = rawPriceTiers; // Assume already validated by route
        if (isActive !== undefined) updateFields.isActive = isActive;


        if (requiresRecalculation) {
            const currentStartTime = updateFields.startTime || showtimeToUpdate.startTime;
            const currentStartTimeMs = dayjs(currentStartTime).valueOf();
            const bufferMs = 15 * 60 * 1000;
            
            // Determine which item (movie/event) to use for duration
            const itemForDuration = updateFields.movie ? await Movie.findById(updateFields.movie).select('duration').session(session) : 
                                    (updateFields.event === null && showtimeToUpdate.movie && !movieIdFromReq) ? await Movie.findById(showtimeToUpdate.movie).select('duration').session(session) : null; // If movie was cleared, but event not set
            const eventForDuration = updateFields.event ? await Event.findById(updateFields.event).select('endDate').session(session) :
                                     (updateFields.movie === null && showtimeToUpdate.event && !eventIdFromReq) ? await Event.findById(showtimeToUpdate.event).select('endDate').session(session) : null;


            if (itemForDuration && typeof itemForDuration.duration === 'number') {
                updateFields.endTime = new Date(currentStartTimeMs + (itemForDuration.duration * 60000) + bufferMs);
            } else if (eventForDuration) {
                updateFields.endTime = eventForDuration.endDate ? dayjs(eventForDuration.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
            } else if ((updateFields.movie===null && !updateFields.event && !showtimeToUpdate.event) || (updateFields.event===null && !updateFields.movie && !showtimeToUpdate.movie)) {
                // if both become null, this should be caught by model validation. Controller should not proceed if no item is linked.
                 await session.abortTransaction(); return res.status(400).json({ msg: 'Showtime must be linked to a movie or an event after update.' });
            } else {
                // If item not changed, use existing showtime item for duration
                const fallbackMovie = showtimeToUpdate.movie && !updateFields.event ? await Movie.findById(showtimeToUpdate.movie._id).select('duration').session(session) : null;
                const fallbackEvent = showtimeToUpdate.event && !updateFields.movie ? await Event.findById(showtimeToUpdate.event._id).select('endDate').session(session) : null;
                if (fallbackMovie && typeof fallbackMovie.duration === 'number') {
                     updateFields.endTime = new Date(currentStartTimeMs + (fallbackMovie.duration * 60000) + bufferMs);
                } else if (fallbackEvent) {
                     updateFields.endTime = fallbackEvent.endDate ? dayjs(fallbackEvent.endDate).toDate() : new Date(currentStartTimeMs + (120 * 60000) + bufferMs);
                } else {
                     console.warn("[updateShowtime] Could not reliably recalculate endTime. Check item linkage.");
                     // Retain old endTime if not recalculable and startTime not changed, or error out
                     if(!updateFields.startTime) updateFields.endTime = showtimeToUpdate.endTime;
                     else { await session.abortTransaction(); return res.status(400).json({msg: "Could not determine endTime after update."})}
                }
            }
        }
        
        // Overlap check before saving (important if startTime, endTime, venue, or screen changes)
        const checkStartTime = updateFields.startTime || showtimeToUpdate.startTime;
        const checkEndTime = updateFields.endTime || showtimeToUpdate.endTime;
        const checkVenue = updateFields.venue || showtimeToUpdate.venue.toString();
        const checkScreen = updateFields.screenId || showtimeToUpdate.screenId.toString();

        const existingOverlap = await Showtime.findOne({
            _id: { $ne: showtimeId }, 
            venue: checkVenue, screenId: checkScreen,
            $or: [ { startTime: { $lt: checkEndTime }, endTime: { $gt: checkStartTime } } ]
        }).session(session);
        if (existingOverlap) {
            await session.abortTransaction(); return res.status(409).json({ msg: 'Updated showtime overlaps with another showtime.' });
        }

        const updatedShowtime = await Showtime.findByIdAndUpdate(showtimeId, { $set: updateFields }, { new: true, runValidators: true, session: session });
        if (!updatedShowtime) { await session.abortTransaction(); return res.status(404).json({ msg: "Showtime update failed or showtime not found." });}
        
        await session.commitTransaction();
        console.log(`[updateShowtime] Transaction committed for ${showtimeId}`);

        let popQuery = Showtime.findById(updatedShowtime._id).populate('venue', 'name');
        if (updatedShowtime.movie) popQuery = popQuery.populate('movie', 'title duration');
        else if (updatedShowtime.event) popQuery = popQuery.populate('event', 'title');
        const populatedResponse = await popQuery.exec();

        res.status(200).json(populatedResponse || updatedShowtime);

    } catch (err) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error(`Error updating showtime ${showtimeId}:`, err);
        if (err.name === 'ValidationError') return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        res.status(500).json({ msg: `Server error updating showtime: ${err.message}` });
    } finally {
        if(session) await session.endSession();
        console.log(`[updateShowtime] Session ended for ${showtimeId}`);
    }
};




// @desc    Delete a showtime (Soft delete recommended)
// @route   DELETE /api/showtimes/:id
// @access  Private (Admin or Owning Organizer)
// exports.deleteShowtime = async (req, res) => {
//     const showtimeId = req.params.id;
//     const userId = req.user.id;
//     const userRole = req.user.role;

//     try {
//         let showtime = await Showtime.findById(showtimeId);
//         if (!showtime) {
//             return res.status(404).json({ msg: 'Showtime not found' });
//         }

//         // 1. Check authorization for the venue
//         const access = await checkVenueAccess(showtime.venue, userId, userRole);
//         if (!access.authorized) {
//             return res.status(access.status).json({ msg: access.error });
//         }

//         // 2. Check for existing bookings (Important!)
//         if (showtime.bookedSeats && showtime.bookedSeats.length > 0) {
//             // Option 1: Prevent deletion
//              return res.status(400).json({ msg: 'Cannot delete showtime with existing bookings. Deactivate instead.' });
//             // Option 2: Implement refund/notification logic (Complex)
//             // Option 3: Proceed with deletion (Risky)
//         }

//         // 3. Perform delete/deactivation
//         // --- Hard Delete ---
//         // await showtime.remove();
//         // res.status(200).json({ msg: 'Showtime deleted successfully' });

//         // --- Soft Delete (Set isActive=false) ---
//          showtime.isActive = false;
//          await showtime.save();
//          res.status(200).json({ msg: 'Showtime deactivated successfully' });


//     } catch (err) {
//         console.error('Error deleting/deactivating showtime:', err.message);
//          if (err.kind === 'ObjectId') {
//              return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
//         }
//         res.status(500).json({ msg: 'Server error' });
//     }
// };

// Delete showtime (no changes needed for tiered pricing logic itself)
exports.deleteShowtime = async (req, res) => { /* ... existing code ... */ };

// Get showtime seatmap (no changes needed for tiered pricing logic itself)
exports.getShowtimeSeatmap = async (req, res) => { /* ... existing code ... */ };

// Get all showtimes (public) - ensure it returns priceTiers
exports.getShowtimes = async (req, res) => {
    const { movieId, eventId, venueId, date, sort } = req.query;
    const query = { isActive: true };
    if (movieId) query.movie = movieId;
    if (eventId) query.event = eventId;
    if (venueId) query.venue = venueId;

    if (date) {
        try {
            const startDate = dayjs(date).startOf('day').toDate();
            const endDate = dayjs(date).endOf('day').toDate();
            query.startTime = { $gte: startDate, $lt: endDate }; // Showtimes starting on this day
        } catch (e) { console.warn("Invalid date format for public showtime filter:", date); }
    } else {
         query.startTime = { $gte: dayjs().startOf('day').toDate() }; // Default to today and future shows
    }

    let sortOptions = { startTime: 1 };
    if (sort === 'price_asc' && false) { /* TODO: Sorting by price is complex with tiers. Maybe sort by lowest tier? */ }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    try {
        const total = await Showtime.countDocuments(query);
        const showtimes = await Showtime.find(query)
            .populate('movie', 'title duration posterUrl averageRating')
            .populate('event', 'title category imageUrl')
            .populate('venue', 'name address.city')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)
            .lean(); // Using lean

        // If you need to display a representative price or price range, process here:
        const processedShowtimes = showtimes.map(st => {
            let displayPriceInfo = "N/A";
            if (st.priceTiers && st.priceTiers.length > 0) {
                const prices = st.priceTiers.map(t => t.price);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                if (minPrice === maxPrice) displayPriceInfo = `Rs. ${minPrice.toFixed(2)}`;
                else displayPriceInfo = `Rs. ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;
            }
            return { ...st, displayPriceInfo };
        });

        const pagination = {};
        if ((startIndex + limit) < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({ success: true, count: showtimes.length, total, pagination, data: processedShowtimes });
    } catch (err) {
        console.error('Error fetching showtimes (public):', err);
        res.status(500).json({ msg: 'Server error fetching showtimes', error: err.message });
    }
};



// @desc    Get seat map layout and booking status for a specific showtime
// @route   GET /api/showtimes/:id/seatmap
// @access  Public
// exports.getShowtimeSeatmap = async (req, res) => {
//     const showtimeId = req.params.id;

//     try {
//         if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
//             return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
//         }

//         // 1. Find the showtime
//         const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive'); // Select necessary fields

//         if (!showtime || !showtime.isActive) {
//             return res.status(404).json({ msg: 'Showtime not found or is inactive' });
//         }

//         // 2. Find the corresponding venue
//         const venue = await Venue.findById(showtime.venue).select('screens'); // Select only screens array

//         if (!venue) {
//             return res.status(404).json({ msg: 'Venue associated with showtime not found' });
//         }

//         // 3. Find the specific screen within the venue's screens array
//         const screen = venue.screens.id(showtime.screenId); // Use Mongoose's .id() subdocument helper

//         if (!screen || !screen.seatLayout) {
//             return res.status(404).json({ msg: 'Screen layout not found for this showtime' });
//         }

//         // 4. Combine Layout with Booking Status
//         // Create a response object that merges the layout with the booked status from the showtime
//         x

//         res.status(200).json(seatMap);

//     } catch (err) {
//         console.error('Error fetching showtime seatmap:', err.message);
//         res.status(500).json({ msg: 'Server error' });
//     }
// };

exports.getShowtimeSeatmap = async (req, res) => {
    const showtimeId = req.params.id;
    console.log(`[getShowtimeSeatmap] Request received for ID: ${showtimeId}`); // Add log

    try {
        if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
            return res.status(404).json({ msg: 'Showtime not found (Invalid ID format)' });
        }

        // 1. Find the showtime
        console.log('[getShowtimeSeatmap] Finding showtime...');
        const showtime = await Showtime.findById(showtimeId).select('venue screenId bookedSeats isActive');
        if (!showtime || !showtime.isActive) {
            console.log(`[getShowtimeSeatmap] Showtime ${showtimeId} not found or inactive.`);
            return res.status(404).json({ msg: 'Showtime not found or is inactive' });
        }
        console.log('[getShowtimeSeatmap] Found showtime.');

        // 2. Find the corresponding venue
        console.log(`[getShowtimeSeatmap] Finding venue: ${showtime.venue}`);
        const venue = await Venue.findById(showtime.venue).select('screens name'); // Select screens and name
        if (!venue) {
            console.log(`[getShowtimeSeatmap] Venue ${showtime.venue} not found.`);
            return res.status(404).json({ msg: 'Venue associated with showtime not found' });
        }
        console.log(`[getShowtimeSeatmap] Found venue: ${venue.name}`);

        // 3. Find the specific screen within the venue's screens array
        console.log(`[getShowtimeSeatmap] Finding screen: ${showtime.screenId} within venue ${venue._id}`);
        const screen = venue.screens.id(showtime.screenId); // Use Mongoose's .id() subdocument helper
        if (!screen || !screen.seatLayout || !Array.isArray(screen.seatLayout.rows)) { // Check seatLayout and rows array
            console.log(`[getShowtimeSeatmap] Screen ${showtime.screenId} or its seatLayout/rows not found/valid.`);
            return res.status(404).json({ msg: 'Screen layout not found or invalid for this showtime' });
        }
        console.log(`[getShowtimeSeatmap] Found screen: ${screen.name}`);

        // 4. Combine Layout with Booking Status
        console.log('[getShowtimeSeatmap] Constructing seat map response...');
        // --- RESTORED seatMap object construction ---
        const seatMap = {
            showtimeId: showtime._id,
            screenId: screen._id,
            screenName: screen.name,
            // Ensure we return the layout object containing the rows array
            layout: {
                rows: screen.seatLayout.rows.map(row => ({
                    // Ensure row and row.seats exist before processing
                    rowId: row?.rowId || 'N/A', // Add fallback
                    seats: Array.isArray(row?.seats) ? row.seats.map(seat => {
                        // Ensure seat and seat.seatNumber exist
                        if (!seat || !seat.seatNumber) return null; // Skip invalid seat data
                        const seatIdentifier = `${row.rowId}${seat.seatNumber}`;
                        return {
                            seatNumber: seat.seatNumber,
                            type: seat.type || 'Normal', // Add fallback
                            identifier: seatIdentifier,
                            isBooked: showtime.bookedSeats.includes(seatIdentifier)
                        };
                    }).filter(seat => seat !== null) : [] // Filter out null seats and handle if row.seats isn't an array
                }))
            }
        };
        // --- END RESTORED BLOCK ---

        console.log('[getShowtimeSeatmap] Sending seat map response.');
        res.status(200).json(seatMap); // Send the correctly constructed seatMap

    } catch (err) {
        // Remove the 'x' variable if it was still there
        console.error('Error fetching showtime seatmap:', err.message); // Log the error message
        console.error(err.stack); // Log the stack trace for more details
        res.status(500).json({ msg: 'Server error' });
    }
};


module.exports = {
    createShowtime: exports.createShowtime,
    getShowtimes: exports.getShowtimes,
    getShowtimeById: exports.getShowtimeById,
    updateShowtime: exports.updateShowtime,
    deleteShowtime: exports.deleteShowtime,
    getShowtimeSeatmap: exports.getShowtimeSeatmap
}