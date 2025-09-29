// client/src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { getShowtimeSeatmapApi, getShowtimeByIdApi } from '../api/showtimes';
import { createBookingApi, cancelPendingBookingApi } from '../api/bookings';
import { createPaymentOrderApi, verifyPaymentApi } from '../api/payments';
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
    const { isAuthenticated, user } = useAuth();

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
    const [pendingBookingId, setPendingBookingId] = useState(null);

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
                    setSeatMapData(mapData);
                    setShowtimeDetails(showtimeData);
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

        let pendingBooking;
        try {
            pendingBooking = await createBookingApi({
                showtimeId,
                seats: selectedSeats,
                ...(promoCode.trim() && { promoCode: promoCode.trim() })
            });
            setPendingBookingId(pendingBooking._id);

            if (pendingBooking.totalAmount === 0) {
                navigate(`/booking-confirmation/${pendingBooking.bookingRefId || pendingBooking._id}`);
                return;
            }

            const paymentOrder = await createPaymentOrderApi(pendingBooking._id);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // This line reads from your .env file
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "BookNOW",
                description: `Booking for ${showtimeDetails?.movie?.title || 'Event'}`,
                order_id: paymentOrder.orderId,
                handler: async function (response) {
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
                prefill: { name: user?.name || '', email: user?.email || '' },
                notes: { booking_id: pendingBooking._id },
                theme: { color: "#D32F2F" },
                modal: {
                    ondismiss: async function() {
                        setBookingError('Payment was not completed. Your seats have been released.');
                        if (pendingBooking && pendingBooking._id) {
                            try {
                                await cancelPendingBookingApi(pendingBooking._id);
                                console.log("Pending booking cancelled and seats released.");
                            } catch (cancelError) {
                                console.error("Could not cancel pending booking:", cancelError);
                                setBookingError('Payment cancelled, but there was an issue releasing seats. Please refresh.');
                            }
                        }
                        setIsBooking(false);
                        setSelectedSeats([]);
                    }
                }
            };
            
            const rzp = new window.Razorpay(options);
            rzp.open();
            rzp.on('payment.failed', function (response) {
                setBookingError(`Payment failed: ${response.error.description}. Please try again.`);
                setIsBooking(false);
            });

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
    
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={7} lg={8}>
                    <Typography variant="h4" component="h1" gutterBottom align="center"> Select Your Seats </Typography>
                    <Typography variant="h6" align="center" color="text.secondary">{itemTitle}</Typography>
                    <Typography variant="subtitle1" gutterBottom align="center" color="text.secondary" sx={{ mb: 2 }}>
                         {showtimeDetails?.venue?.name} - Screen: {seatMapData?.screenName || 'N/A'}
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