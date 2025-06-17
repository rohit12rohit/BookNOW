// client/src/pages/BookingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { getShowtimeSeatmapApi, getShowtimeByIdApi } from '../api/showtimes';
import { createBookingApi } from '../api/bookings';
import { getSettingApi } from '../api/settings';
import { getAvailablePromoCodesApi, verifyPromoCodeApi } from '../api/promocodes';
import { useAuth } from '../contexts/AuthContext';
import {
    Container, Typography, Box, Paper, CircularProgress, Alert, Button,
    Divider, TextField, Link as MuiLink, Grid, List, ListItem, ListItemText,
    Autocomplete
} from '@mui/material';
import SeatMap from '../components/SeatMap';
import dayjs from 'dayjs';

const BookingPage = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const [seatMapData, setSeatMapData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [showtimeDetails, setShowtimeDetails] = useState(null);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [availablePromoCodes, setAvailablePromoCodes] = useState([]);
    const [verifiedPromoCode, setVerifiedPromoCode] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingError, setBookingError] = useState(null);
    const [isBooking, setIsBooking] = useState(false);
    const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
    const [promoVerificationError, setPromoVerificationError] = useState(null);

    const [calculatedSubtotal, setCalculatedSubtotal] = useState(0);
    const [calculatedDiscount, setCalculatedDiscount] = useState(0); // This variable is correctly declared
    const [calculatedGSTAmount, setCalculatedGSTAmount] = useState(0);
    const [currentGSTPercent, setCurrentGSTPercent] = useState(0);

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
                const [mapData, showtimeDataResponse, gstSettingResponse, promoCodesResponse] = await Promise.all([
                    getShowtimeSeatmapApi(showtimeId),
                    getShowtimeByIdApi(showtimeId),
                    getSettingApi('GST_RATE'),
                    getAvailablePromoCodesApi()
                ]);

                if (isMounted) {
                    if (mapData?.layout?.rows) {
                        setSeatMapData(mapData);
                    } else {
                        setError(prev => prev || 'Seat layout data is invalid.');
                        setSeatMapData(null);
                    }

                    if (showtimeDataResponse?._id && Array.isArray(showtimeDataResponse.priceTiers) && showtimeDataResponse.priceTiers.length > 0) {
                        setShowtimeDetails(showtimeDataResponse);
                    } else {
                        console.warn("[BookingPage] Showtime details missing, invalid, or no priceTiers:", showtimeDataResponse);
                        setError(prev => prev || 'Could not load showtime price information or no price tiers defined.');
                        setShowtimeDetails(null);
                    }

                    if (gstSettingResponse && typeof gstSettingResponse.value === 'number') {
                        setCurrentGSTPercent(gstSettingResponse.value);
                    } else {
                        console.warn("[BookingPage] GST_RATE setting not found or invalid, defaulting to 0%.", gstSettingResponse);
                        setCurrentGSTPercent(0);
                    }

                    if (Array.isArray(promoCodesResponse)) {
                        setAvailablePromoCodes(promoCodesResponse);
                    } else {
                        console.warn("[BookingPage] Available promo codes response invalid.", promoCodesResponse);
                        setAvailablePromoCodes([]);
                    }
                }
            } catch (err) {
                 if (isMounted) {
                    setError(err.message || 'Failed to load booking page data.');
                    setSeatMapData(null);
                    setShowtimeDetails(null);
                    setCurrentGSTPercent(0);
                    setAvailablePromoCodes([]);
                 }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [showtimeId]);

    useEffect(() => {
        if (!seatMapData || !showtimeDetails || !Array.isArray(showtimeDetails.priceTiers)) {
            setCalculatedSubtotal(0);
            setCalculatedGSTAmount(0);
            setSelectedSeatsWithPrices([]);
            return;
        }

        let currentSubtotal = 0;
        const seatsWithDetails = [];

        selectedSeats.forEach(seatIdentifier => {
            let seatType = 'Normal';
            let foundSeat = false;
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
                return;
            }

            const tier = showtimeDetails.priceTiers.find(pt => pt.seatType === seatType);
            const price = tier ? tier.price : (showtimeDetails.priceTiers.find(t => t.seatType === 'Normal')?.price || 0);

            currentSubtotal += price;
            seatsWithDetails.push({ identifier: seatIdentifier, type: seatType, price });
        });
        
        setCalculatedSubtotal(currentSubtotal);
        setSelectedSeatsWithPrices(seatsWithDetails);

        let appliedDiscountAmount = 0;
        if (verifiedPromoCode && verifiedPromoCode.valid && typeof verifiedPromoCode.discount === 'number') {
            appliedDiscountAmount = verifiedPromoCode.discount;
        }
        setCalculatedDiscount(appliedDiscountAmount);

        let amountAfterDiscount = Math.max(currentSubtotal - appliedDiscountAmount, 0);
        const calculatedGST = parseFloat(((amountAfterDiscount * currentGSTPercent) / 100).toFixed(2));
        setCalculatedGSTAmount(calculatedGST);

    }, [selectedSeats, seatMapData, showtimeDetails, verifiedPromoCode, currentGSTPercent]);

    const handleSeatSelect = useCallback((seatIdentifier) => {
        setSelectedSeats(prevSelected => {
            if (prevSelected.includes(seatIdentifier)) {
                return prevSelected.filter(s => s !== seatIdentifier);
            } else { return [...prevSelected, seatIdentifier]; }
        });
        setBookingError(null);
        setPromoVerificationError(null);
        setVerifiedPromoCode(null);
        setPromoCodeInput('');
    }, []);

    const handlePromoCodeInputChange = (event, newValue) => {
        setPromoCodeInput(newValue ? newValue.code || newValue : '');
        setPromoVerificationError(null);
        setVerifiedPromoCode(null);
    };

    const handleVerifyPromoCode = async () => {
        if (!promoCodeInput.trim() || calculatedSubtotal === 0) {
            setPromoVerificationError('Enter a promo code and select seats first.');
            return;
        }
        setIsVerifyingPromo(true);
        setPromoVerificationError(null);
        setVerifiedPromoCode(null);

        try {
            const verificationResult = await verifyPromoCodeApi(promoCodeInput.trim(), calculatedSubtotal);
            setVerifiedPromoCode({
                valid: verificationResult.valid,
                discount: verificationResult.discount,
                msg: verificationResult.msg,
                promoDetails: verificationResult.promoDetails
            });
        } catch (err) {
            const apiError = err.msg || err.message || 'Failed to verify promo code.';
            setPromoVerificationError(apiError);
            setVerifiedPromoCode({ valid: false, discount: 0, msg: apiError });
        } finally {
            setIsVerifyingPromo(false);
        }
    };

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
        if (!showtimeDetails || !Array.isArray(showtimeDetails.priceTiers) || showtimeDetails.priceTiers.length === 0) {
            setBookingError("Price information is currently unavailable for this showtime. Please try again later.");
            return;
        }

        setIsBooking(true); setBookingError(null);
        const bookingData = {
            showtimeId: showtimeId,
            seats: selectedSeats,
            ...(verifiedPromoCode?.valid && verifiedPromoCode?.discount > 0 && { promoCode: promoCodeInput.trim() })
        };
        console.log("Submitting Booking Payload to API:", bookingData);

        try {
            const result = await createBookingApi(bookingData);
            navigate(`/booking-confirmation/${result.bookingRefId || result._id}`);
        }
        // Catch block for createBookingApi error
        catch (err) {
            console.error("Booking failed:", err);
            const errorMsg = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || err.message || 'Booking failed. Please try again.');
            setBookingError(errorMsg);
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    
    if (!showtimeDetails || !Array.isArray(showtimeDetails.priceTiers) || showtimeDetails.priceTiers.length === 0) {
        return <Container sx={{ py: 4 }}><Alert severity="error">Showtime price information is unavailable or not configured correctly.</Alert></Container>;
    }
    if (!seatMapData || !Array.isArray(seatMapData.layout?.rows)) {
        return <Container sx={{ py: 4 }}><Alert severity="warning">Seat map data unavailable or invalid.</Alert></Container>;
    }

    const itemTitle = showtimeDetails?.movie?.title || showtimeDetails?.event?.title || 'Event/Movie';
    const venueName = showtimeDetails?.venue?.name || 'Venue N/A';
    const screenName = seatMapData?.screenName || showtimeDetails?.screenName || 'N/A';

    const amountAfterDiscount = calculatedSubtotal - calculatedDiscount;
    const finalDisplayTotal = amountAfterDiscount + calculatedGSTAmount;


    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
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
                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1}}>
                            <Typography variant="body1">Subtotal (Seats):</Typography>
                            <Typography variant="body1">Rs. {calculatedSubtotal.toFixed(2)}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <Autocomplete
                                freeSolo
                                options={availablePromoCodes}
                                getOptionLabel={(option) => option.code || option}
                                sx={{ flexGrow: 1 }}
                                value={promoCodeInput}
                                onChange={(event, newValue) => handlePromoCodeInputChange(event, newValue)}
                                onInputChange={(event, newInputValue) => handlePromoCodeInputChange(event, newInputValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Promo Code (Optional)"
                                        variant="outlined"
                                        size="small"
                                        disabled={isBooking || selectedSeats.length === 0 || isVerifyingPromo}
                                    />
                                )}
                                disabled={availablePromoCodes.length === 0}
                            />
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleVerifyPromoCode}
                                disabled={!promoCodeInput.trim() || calculatedSubtotal === 0 || isVerifyingPromo || selectedSeats.length === 0} // Added disabled conditions
                                sx={{ height: '40px', mt: '8px' }}
                            >
                                {isVerifyingPromo ? <CircularProgress size={24} /> : 'Verify'}
                            </Button>
                        </Box>
                        {promoVerificationError && <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem' }}>{promoVerificationError}</Alert>}
                        {verifiedPromoCode?.valid && !promoVerificationError && (
                            <Alert severity="success" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                {verifiedPromoCode.msg} {verifiedPromoCode.discount > 0 && `(Discount: Rs. ${verifiedPromoCode.discount.toFixed(2)})`}
                            </Alert>
                        )}

                        {calculatedDiscount > 0 && (
                            <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1, color: 'success.main'}}>
                                <Typography variant="body1">Discount:</Typography>
                                <Typography variant="body1">- Rs. {calculatedDiscount.toFixed(2)}</Typography>
                            </Box>
                        )}

                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1}}>
                            <Typography variant="body1">GST ({currentGSTPercent}%):</Typography>
                            <Typography variant="body1">Rs. {calculatedGSTAmount.toFixed(2)}</Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }}/>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', my: 1.5}}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total Payable:</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}> Rs. {finalDisplayTotal.toFixed(2)} </Typography>
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