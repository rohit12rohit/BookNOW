

// // client/src/pages/BookingPage.jsx (Corrected API Call)
// import React, { useState, useEffect, useCallback } from 'react';
// import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
// // Import API functions
// import { getShowtimeSeatmapApi, getShowtimeByIdApi } from '../api/showtimes'; // << Ensure getShowtimeByIdApi is imported
// import { createBookingApi } from '../api/bookings';
// import { useAuth } from '../contexts/AuthContext';
// // MUI Components
// import Container from '@mui/material/Container';
// import Typography from '@mui/material/Typography';
// import Box from '@mui/material/Box';
// import Paper from '@mui/material/Paper';
// import CircularProgress from '@mui/material/CircularProgress';
// import Alert from '@mui/material/Alert';
// import Button from '@mui/material/Button';
// import Divider from '@mui/material/Divider';
// import TextField from '@mui/material/TextField';
// import Link from '@mui/material/Link';
// import SeatMap from '../components/SeatMap';
// import dayjs from 'dayjs'; // Import dayjs for formatting

// const BookingPage = () => {
//     const { showtimeId } = useParams();
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { isAuthenticated, user } = useAuth();

//     const [seatMapData, setSeatMapData] = useState(null);
//     const [selectedSeats, setSelectedSeats] = useState([]);
//     const [showtimeDetails, setShowtimeDetails] = useState(null); // Store full showtime details
//     const [promoCode, setPromoCode] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [bookingError, setBookingError] = useState(null);
//     const [isBooking, setIsBooking] = useState(false);

//     // Fetch Seat Map and Showtime details (for price, movie title etc.)
//     useEffect(() => {
//         let isMounted = true; // Prevent state updates on unmounted component
//         const fetchData = async () => {
//             if (!showtimeId) {
//                 if (isMounted) { setError("Showtime ID missing."); setIsLoading(false); }
//                 return;
//             }
//             if (isMounted) { setIsLoading(true); setError(null); setBookingError(null); }
//             console.log(`[BookingPage] Fetching data for showtimeId: ${showtimeId}`);
//             try {
//                 // Fetch both in parallel
//                 const [mapData, showtimeData] = await Promise.all([
//                     getShowtimeSeatmapApi(showtimeId),
//                     getShowtimeByIdApi(showtimeId) // << Use the imported API function
//                 ]);

//                 console.log("[BookingPage] Seatmap API response:", mapData);
//                 console.log("[BookingPage] Showtime Details API response:", showtimeData);

//                 if (isMounted) {
//                     // Validate seatmap data
//                     if (mapData?.layout?.rows) {
//                         setSeatMapData(mapData);
//                     } else {
//                         console.warn("[BookingPage] Invalid seat map data received:", mapData);
//                         setError('Seat layout data is invalid.');
//                         setSeatMapData(null);
//                     }

//                     // Validate showtime data
//                     if (showtimeData?._id && typeof showtimeData.price === 'number') {
//                         setShowtimeDetails(showtimeData);
//                     } else {
//                         console.warn("[BookingPage] Invalid showtime details received:", showtimeData);
//                         // Set error only if seatmap was okay but price failed
//                         if (mapData?.layout?.rows && !error) {
//                              setError('Could not load showtime price information.');
//                         }
//                         setShowtimeDetails(null);
//                     }
//                 }

//             } catch (err) {
//                 console.error("[BookingPage] Error fetching data:", err);
//                  if (isMounted) setError(err.message || 'Failed to load booking page data.');
//                  if (isMounted) setSeatMapData(null);
//                  if (isMounted) setShowtimeDetails(null);
//             } finally {
//                 if (isMounted) setIsLoading(false);
//             }
//         };
//         fetchData();

//         // Cleanup function
//         return () => { isMounted = false; };
//     }, [showtimeId]); // Re-run if showtimeId changes

//     // Handle seat selection/deselection
//     const handleSeatSelect = useCallback((seatIdentifier) => {
//         setSelectedSeats(prevSelected => {
//             if (prevSelected.includes(seatIdentifier)) {
//                 return prevSelected.filter(s => s !== seatIdentifier);
//             } else { return [...prevSelected, seatIdentifier]; }
//         });
//          setBookingError(null);
//     }, []);

//     // Handle Promo Code Change
//     const handlePromoChange = (event) => { setPromoCode(event.target.value); };

//     // Handle Proceed to Book
//     const handleProceed = async () => {
//         if (!isAuthenticated) {
//             setBookingError("Please login to proceed with booking.");
//             navigate('/login', { state: { from: location } });
//             return;
//         }
//         if (selectedSeats.length === 0) {
//             setBookingError("Please select at least one seat.");
//             return;
//         }

//         setIsBooking(true); setBookingError(null);
//         const bookingData = {
//             showtimeId: showtimeId,
//             seats: selectedSeats,
//             ...(promoCode.trim() && { promoCode: promoCode.trim() })
//         };

//         try {
//             const result = await createBookingApi(bookingData);
//             console.log("Booking successful:", result);
//             navigate(`/booking-confirmation/${result._id}`); // Redirect to confirmation page

//         } catch (err) {
//             console.error("Booking failed:", err);
//             const errorMsg = err?.errors ? err.errors.map(e => e.msg).join(', ') : (err?.msg || err.message || 'Booking failed. Please try again.');
//             setBookingError(errorMsg);
//         } finally {
//             setIsBooking(false);
//         }
//     };

//     // Calculate total price
//     const totalPrice = (showtimeDetails?.price || 0) * selectedSeats.length;

//     // --- Render Logic ---
//     if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
//     // If main error exists (e.g., seatmap failed completely)
//     if (error && !seatMapData) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
//     // If seatmap loaded but showtime details (price) failed
//     if (!showtimeDetails && seatMapData) return <Container sx={{ py: 4 }}><Alert severity="warning">Could not load price details. Please try again later.</Alert></Container>;
//     // If seatmap itself is invalid/missing after loading
//     if (!seatMapData || !Array.isArray(seatMapData.layout)) {
//         return <Container sx={{ py: 4 }}><Alert severity="warning">Seat map data unavailable or invalid.</Alert></Container>;
//    }
//     // --- If all essential data loaded ---
//     const itemTitle = showtimeDetails?.movie?.title || showtimeDetails?.event?.title || 'Event/Movie';
//     const venueName = showtimeDetails?.venue?.name || 'Venue N/A';

//     return (
//         <Container maxWidth="md" sx={{ py: 4 }}>
//             <Typography variant="h4" component="h1" gutterBottom align="center"> Select Your Seats </Typography>
//             <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
//                  {itemTitle}
//                  {' @ '}
//                  {showtimeDetails?.startTime ? dayjs(showtimeDetails.startTime).format('h:mm A') : ''}
//                  {' on '}
//                  {showtimeDetails?.startTime ? dayjs(showtimeDetails.startTime).format('ddd, DD MMM') : ''}
//             </Typography>
//             <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 2 }}>
//                  {venueName} - Screen: {seatMapData.screenName || 'N/A'}
//             </Typography>

//             <Paper elevation={3} sx={{ p: { xs: 1, sm: 2, md: 3 }, mb: 3 }}>
//                 <SeatMap
//                     seatLayout={seatMapData.layout.rows}
//                     selectedSeats={selectedSeats}
//                     onSeatSelect={handleSeatSelect}
//                 />
//             </Paper>

//             {/* Booking Summary / Actions */}
//             <Paper elevation={3} sx={{ p: 3 }}>
//                 <Typography variant="h6" gutterBottom>Booking Summary</Typography>
//                 <Divider sx={{ mb: 2 }}/>
//                 <Typography variant="body1" component="div"> Selected Seats: {' '} {selectedSeats.length > 0 ? ( <Box component="span" sx={{ fontWeight: 'bold' }}>{selectedSeats.join(', ')}</Box> ) : ( <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>None</Box> )} </Typography>
//                 <Typography variant="body1" sx={{ fontWeight: 'bold', my: 1 }}> Ticket Price: Rs. {showtimeDetails?.price?.toFixed(2) || 'N/A'} per seat </Typography>
//                 <Typography variant="h6" sx={{ fontWeight: 'bold', my: 2 }}> Total: Rs. {totalPrice.toFixed(2)} </Typography>
//                 <TextField label="Promo Code (Optional)" variant="outlined" size="small" fullWidth value={promoCode} onChange={handlePromoChange} sx={{ mb: 2 }} disabled={isBooking || selectedSeats.length === 0} />
//                 {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
//                 <Button variant="contained" color="error" size="large" fullWidth onClick={handleProceed} disabled={selectedSeats.length === 0 || isBooking} >
//                     {isBooking ? <CircularProgress size={24} color="inherit" /> : `Proceed to Book (${selectedSeats.length} Seat(s))`}
//                 </Button>
//                 {!isAuthenticated && ( <Alert severity="info" sx={{ mt: 2 }}> Please <Link component={RouterLink} to="/login" state={{ from: location }}>login</Link> or <Link component={RouterLink} to="/register">register</Link> to complete your booking. </Alert> )}
//             </Paper>
//         </Container>
//     );
// };

// export default BookingPage;

// client/src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { getShowtimeSeatmapApi, getShowtimeByIdApi } from '../api/showtimes';
import { createBookingApi } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';
import {
    Container, Typography, Box, Paper, CircularProgress, Alert, Button,
    Divider, TextField, Link as MuiLink, Grid, List, ListItem, ListItemText
} from '@mui/material';
import SeatMap from '../components/SeatMap';
import dayjs from 'dayjs';

const BookingPage = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const [seatMapData, setSeatMapData] = useState(null); // Includes { ..., layout: { rows: [{..., seats: [{..., type}] }] } }
    const [selectedSeats, setSelectedSeats] = useState([]); // Array of seat identifiers like "A1"
    const [showtimeDetails, setShowtimeDetails] = useState(null); // Includes { ..., priceTiers: [{seatType, price}] }
    const [promoCode, setPromoCode] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingError, setBookingError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [calculatedTotalPrice, setCalculatedTotalPrice] = useState(0);
    const [selectedSeatsWithPrices, setSelectedSeatsWithPrices] = useState([]);


    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            if (!showtimeId) {
                if (isMounted) { setError("Showtime ID missing from URL."); setIsLoading(false); }
                return;
            }
            if (isMounted) { setIsLoading(true); setError(null); setBookingError(null); }
            try {
                const [mapData, showtimeDataResponse] = await Promise.all([
                    getShowtimeSeatmapApi(showtimeId),
                    getShowtimeByIdApi(showtimeId)
                ]);

                if (isMounted) {
                    if (mapData?.layout?.rows) {
                        setSeatMapData(mapData);
                    } else {
                        setError(prev => prev || 'Seat layout data is invalid.');
                        setSeatMapData(null);
                    }

                    // Check for priceTiers in showtimeDataResponse
                    if (showtimeDataResponse?._id && Array.isArray(showtimeDataResponse.priceTiers) && showtimeDataResponse.priceTiers.length > 0) {
                        setShowtimeDetails(showtimeDataResponse);
                    } else {
                        console.warn("[BookingPage] Showtime details missing, invalid, or no priceTiers:", showtimeDataResponse);
                        setError(prev => prev || 'Could not load showtime price information or no price tiers defined.');
                        setShowtimeDetails(null);
                    }
                }
            } catch (err) {
                 if (isMounted) {
                    setError(err.message || 'Failed to load booking page data.');
                    setSeatMapData(null);
                    setShowtimeDetails(null);
                 }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [showtimeId]);

    // Calculate total price and selected seats with prices whenever selectedSeats, seatMapData, or showtimeDetails change
    useEffect(() => {
        if (!seatMapData || !showtimeDetails || !Array.isArray(showtimeDetails.priceTiers)) {
            setCalculatedTotalPrice(0);
            setSelectedSeatsWithPrices([]);
            return;
        }

        let currentTotal = 0;
        const seatsWithDetails = [];

        selectedSeats.forEach(seatIdentifier => {
            let seatType = 'Normal'; // Default type
            let foundSeat = false;
            // Find the type of the selected seat from seatMapData
            for (const row of seatMapData.layout.rows) {
                const seat = row.seats.find(s => s.identifier === seatIdentifier);
                if (seat) {
                    seatType = seat.type || 'Normal';
                    foundSeat = true;
                    break;
                }
            }

            if (!foundSeat) {
                console.warn(`Seat ${seatIdentifier} not found in seatMapData.layout for price calculation.`);
                seatsWithDetails.push({ identifier: seatIdentifier, type: 'Unknown', price: 0 });
                return; // Skip if seat details not found in layout
            }

            // Find the price for that seat type from showtimeDetails.priceTiers
            const tier = showtimeDetails.priceTiers.find(t => t.seatType === seatType);
            const price = tier ? tier.price : (showtimeDetails.priceTiers.find(t => t.seatType === 'Normal')?.price || 0); // Fallback to Normal or 0

            currentTotal += price;
            seatsWithDetails.push({ identifier: seatIdentifier, type: seatType, price });
        });

        setCalculatedTotalPrice(currentTotal);
        setSelectedSeatsWithPrices(seatsWithDetails);

    }, [selectedSeats, seatMapData, showtimeDetails]);


    const handleSeatSelect = useCallback((seatIdentifier) => {
        setSelectedSeats(prevSelected => {
            if (prevSelected.includes(seatIdentifier)) {
                return prevSelected.filter(s => s !== seatIdentifier);
            } else { return [...prevSelected, seatIdentifier]; }
        });
         setBookingError(null);
    }, []);

    const handlePromoChange = (event) => { setPromoCode(event.target.value); };

    const handleProceed = async () => {
        if (!isAuthenticated) {
            setBookingError("Please login to proceed with booking.");
            navigate('/login', { state: { from: location } });
            return;
        }
        if (selectedSeats.length === 0) {
            setBookingError("Please select at least one seat.");
            return;
        }
        // Ensure price information is loaded
        if (!showtimeDetails || !Array.isArray(showtimeDetails.priceTiers) || showtimeDetails.priceTiers.length === 0) {
            setBookingError("Price information is currently unavailable for this showtime. Please try again later.");
            return;
        }


        setIsBooking(true); setBookingError(null);
        const bookingData = {
            showtimeId: showtimeId,
            seats: selectedSeats, // Array of seat identifiers like "A1", "B2"
            // The backend will calculate the final amount based on these seats and priceTiers
            ...(promoCode.trim() && { promoCode: promoCode.trim() })
        };
        console.log("Submitting Booking Payload to API:", bookingData);

        try {
            const result = await createBookingApi(bookingData);
            navigate(`/booking-confirmation/${result.bookingRefId || result._id}`); // Use bookingRefId if available
        } catch (err) {
            const errorMsg = err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || err.message || 'Booking failed. Please try again.');
            setBookingError(errorMsg);
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    
    // Specific check if price info is missing after loading, which is now an error condition
    if (!showtimeDetails || !Array.isArray(showtimeDetails.priceTiers) || showtimeDetails.priceTiers.length === 0) {
        return <Container sx={{ py: 4 }}><Alert severity="error">Showtime price information is unavailable or not configured correctly.</Alert></Container>;
    }
    if (!seatMapData || !Array.isArray(seatMapData.layout?.rows)) {
        return <Container sx={{ py: 4 }}><Alert severity="warning">Seat map data unavailable or invalid.</Alert></Container>;
    }

    const itemTitle = showtimeDetails?.movie?.title || showtimeDetails?.event?.title || 'Event/Movie';
    const venueName = showtimeDetails?.venue?.name || 'Venue N/A';
    const screenName = seatMapData?.screenName || showtimeDetails?.screenName || 'N/A';


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}> {/* Changed to lg for more space */}
            <Grid container spacing={3}>
                {/* Left Side: Seat Map & Info */}
                <Grid item xs={12} md={7} lg={8}>
                    <Typography variant="h4" component="h1" gutterBottom align="center"> Select Your Seats </Typography>
                    <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
                         {itemTitle} @ {showtimeDetails?.startTime ? dayjs(showtimeDetails.startTime).format('h:mm A') : ''} on {showtimeDetails?.startTime ? dayjs(showtimeDetails.startTime).format('ddd, DD MMM') : ''}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 2 }}>
                         {venueName} - Screen: {screenName}
                    </Typography>

                    <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 }, mb: 3 }}>
                        <SeatMap
                            seatLayoutRows={seatMapData.layout.rows}
                            selectedSeats={selectedSeats}
                            onSeatSelect={handleSeatSelect}
                        />
                    </Paper>
                </Grid>

                {/* Right Side: Booking Summary */}
                <Grid item xs={12} md={5} lg={4}>
                    <Paper elevation={3} sx={{ p: {xs:2, sm:3}, position: 'sticky', top: '80px' }}> {/* Sticky summary */}
                        <Typography variant="h5" gutterBottom sx={{fontWeight:'bold'}}>Booking Summary</Typography>
                        <Divider sx={{ mb: 2 }}/>
                        
                        {selectedSeatsWithPrices.length > 0 ? (
                            <List dense sx={{maxHeight: 200, overflow: 'auto', mb:1}}>
                                {selectedSeatsWithPrices.map(seat => (
                                    <ListItem key={seat.identifier} disablePadding sx={{display: 'flex', justifyContent:'space-between'}}>
                                        <ListItemText primary={`Seat: ${seat.identifier} (${seat.type})`} />
                                        <Typography variant="body2">Rs. {seat.price.toFixed(2)}</Typography>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{my:2, textAlign: 'center'}}>
                                Please select your seats from the map.
                            </Typography>
                        )}
                        
                        <Divider sx={{ my: 2 }}/>
                        <TextField label="Promo Code (Optional)" variant="outlined" size="small" fullWidth value={promoCode} onChange={handlePromoChange} sx={{ mb: 2 }} disabled={isBooking || selectedSeats.length === 0} />
                        
                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1.5}}>
                            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>Subtotal:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}> Rs. {calculatedTotalPrice.toFixed(2)} </Typography>
                        </Box>
                        {/* Convenience fee, taxes etc. can be added here later */}
                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1.5}}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total Payable:</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}> Rs. {calculatedTotalPrice.toFixed(2)} </Typography>
                        </Box>

                        {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
                        <Button variant="contained" color="error" size="large" fullWidth onClick={handleProceed} disabled={selectedSeats.length === 0 || isBooking || isLoading} >
                            {isBooking ? <CircularProgress size={24} color="inherit" /> : `Proceed to Book (${selectedSeats.length} Seat(s))`}
                        </Button>
                        {!isAuthenticated && ( <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}> Please <MuiLink component={RouterLink} to="/login" state={{ from: location }} color="error.dark">login</MuiLink> or <MuiLink component={RouterLink} to="/register" color="error.dark">register</MuiLink> to complete your booking. </Alert> )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BookingPage;