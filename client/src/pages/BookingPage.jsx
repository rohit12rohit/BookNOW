// File: /client/src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { getShowtimeSeatmapApi, getShowtimeByIdApi } from '../api/showtimes';
import { createBookingApi } from '../api/bookings';
import { createPaymentOrderApi, verifyPaymentApi } from '../api/payments'; // Import payment APIs
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
    const { isAuthenticated, user } = useAuth(); // Get user for Razorpay prefill

    const [seatMapData, setSeatMapData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [showtimeDetails, setShowtimeDetails] = useState(null);
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
            if (!showtimeId) { if (isMounted) { setError("Showtime ID missing."); setIsLoading(false); } return; }
            setIsLoading(true); setError(null);
            try {
                const [mapData, showtimeData] = await Promise.all([
                    getShowtimeSeatmapApi(showtimeId),
                    getShowtimeByIdApi(showtimeId)
                ]);
                if (isMounted) {
                    if (mapData?.layout?.rows) setSeatMapData(mapData);
                    else setError('Seat layout data is invalid.');
                    if (showtimeData?._id && Array.isArray(showtimeData.priceTiers)) setShowtimeDetails(showtimeData);
                    else setError(prev => prev || 'Could not load showtime price information.');
                }
            } catch (err) {
                if (isMounted) setError(err.message || 'Failed to load data.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [showtimeId]);

    useEffect(() => {
        if (!seatMapData || !showtimeDetails) return;
        let total = 0;
        const seatsWithPrices = selectedSeats.map(seatId => {
            let seatType = 'Normal';
            for (const row of seatMapData.layout.rows) {
                const seat = row.seats.find(s => s.identifier === seatId);
                if (seat) { seatType = seat.type || 'Normal'; break; }
            }
            const tier = showtimeDetails.priceTiers.find(t => t.seatType === seatType);
            const price = tier ? tier.price : 0;
            total += price;
            return { identifier: seatId, type: seatType, price };
        });
        setCalculatedTotalPrice(total);
        setSelectedSeatsWithPrices(seatsWithPrices);
    }, [selectedSeats, seatMapData, showtimeDetails]);


    const handleSeatSelect = useCallback((seatIdentifier) => {
        setSelectedSeats(prev => prev.includes(seatIdentifier) ? prev.filter(s => s !== seatIdentifier) : [...prev, seatIdentifier]);
        setBookingError(null);
    }, []);

    const handlePromoChange = (event) => setPromoCode(event.target.value);

    const handleProceed = async () => {
        if (!isAuthenticated) { navigate('/login', { state: { from: location } }); return; }
        if (selectedSeats.length === 0) { setBookingError("Please select at least one seat."); return; }
        
        setIsBooking(true);
        setBookingError(null);

        try {
            // Step 1: Create a 'PaymentPending' booking on our server
            const pendingBooking = await createBookingApi({
                showtimeId,
                seats: selectedSeats,
                ...(promoCode.trim() && { promoCode: promoCode.trim() })
            });

            if (pendingBooking.totalAmount === 0) {
                // If it's a free booking (e.g., 100% discount), skip payment and go to confirmation
                navigate(`/booking-confirmation/${pendingBooking.bookingRefId || pendingBooking._id}`);
                return;
            }

            // Step 2: Create a payment order with Razorpay via our backend
            const paymentOrder = await createPaymentOrderApi(pendingBooking._id);

            // Step 3: Configure and open Razorpay Checkout
            const options = {
                key: "YOUR_RAZORPAY_KEY_ID", // IMPORTANT: Replace with your actual Key ID from .env
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "BookNOW",
                description: `Booking for ${showtimeDetails?.movie?.title || 'Event'}`,
                image: "https://example.com/your_logo.png", // Optional
                order_id: paymentOrder.orderId,
                handler: async function (response) {
                    // Step 4: Handle successful payment
                    try {
                        const verificationData = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: pendingBooking._id,
                        };
                        const result = await verifyPaymentApi(verificationData);
                        navigate(`/booking-confirmation/${result.bookingRefId || result.bookingId}`);
                    } catch (verifyError) {
                        setBookingError(verifyError.msg || 'Payment verification failed. Please contact support.');
                        setIsBooking(false);
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                },
                notes: {
                    booking_id: pendingBooking._id,
                },
                theme: {
                    color: "#D32F2F" // Matches our error/primary color
                },
                modal: {
                    ondismiss: function() {
                        // This function is called when the user closes the payment window.
                        setBookingError('Payment was not completed. Your seats have been released. Please try again.');
                        // TODO: We need a backend route to cancel the pending booking and release seats here.
                        setIsBooking(false);
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err) {
            const errorMsg = err.errors ? err.errors.map(e => e.msg).join(', ') : (err.msg || 'An error occurred. Please try again.');
            setBookingError(errorMsg);
            setIsBooking(false);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!showtimeDetails || !seatMapData) return <Container sx={{ py: 4 }}><Alert severity="warning">Booking information is currently unavailable.</Alert></Container>;
    
    const itemTitle = showtimeDetails?.movie?.title || showtimeDetails?.event?.title || 'Event/Movie';
    const venueName = showtimeDetails?.venue?.name || 'Venue N/A';
    const screenName = seatMapData?.screenName || showtimeDetails?.screenName || 'N/A';
    
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={3}>
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
                <Grid item xs={12} md={5} lg={4}>
                    <Paper elevation={3} sx={{ p: {xs:2, sm:3}, position: 'sticky', top: '80px' }}>
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
                        
                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1.5}}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total Payable:</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}> Rs. {calculatedTotalPrice.toFixed(2)} </Typography>
                        </Box>

                        {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
                        <Button variant="contained" color="error" size="large" fullWidth onClick={handleProceed} disabled={selectedSeats.length === 0 || isBooking}>
                            {isBooking ? <CircularProgress size={24} color="inherit" /> : `Pay ₹${calculatedTotalPrice.toFixed(2)}`}
                        </Button>
                        {!isAuthenticated && ( <Alert severity="info" sx={{ mt: 2, fontSize: '0.8rem' }}> Please <MuiLink component={RouterLink} to="/login" state={{ from: location }} color="error.dark">login</MuiLink> or <MuiLink component={RouterLink} to="/register" color="error.dark">register</MuiLink> to complete your booking. </Alert> )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default BookingPage;