// client/src/pages/BookingConfirmationPage.jsx (Detailed QR Code)
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getBookingByIdApi } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Import QR Code Component (ensure qrcode.react is installed)
import { QRCodeSVG } from 'qrcode.react';

const BookingConfirmationPage = () => {
    const { bookingId } = useParams();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrCodeValue, setQrCodeValue] = useState(''); // State for the QR code data string

    useEffect(() => {
        let isMounted = true;
        const fetchBooking = async () => {
            if (!bookingId) { if(isMounted){ setError("Booking ID missing."); setIsLoading(false); } return; }
            if (isAuthLoading) { console.log("Booking Confirmation: Waiting for auth check..."); return; }
            if (!user) { if(isMounted){ setError("User not authenticated. Cannot fetch booking details."); setIsLoading(false); } return; }

            console.log(`Booking Confirmation: Fetching details for booking ${bookingId}`);
            if(isMounted){ setIsLoading(true); setError(null); }
            try {
                const data = await getBookingByIdApi(bookingId);
                if (isMounted) {
                    if (data?.user?._id !== user?._id) {
                        setError("Unauthorized to view this booking details.");
                        setBooking(null);
                    } else {
                        setBooking(data);
                        // --- Construct QR Code Value ---
                        if (data) {
                            const show = data.showtime;
                            const itemTitle = show?.movie?.title || show?.event?.title || 'Item';
                            const venueName = show?.venue?.name || 'N/A';
                            const screenName = show?.screenName || 'N/A';
                            const startTimeFormatted = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'N/A';
                            const seatsFormatted = data.seats?.join(', ') || 'N/A';
                            const amountPaidFormatted = data.totalAmount?.toFixed(2);
                            const refId = data.bookingRefId || data._id; // Prioritize bookingRefId

                            // You can structure this string as needed. A simple key-value pair or JSON string is good.
                            // Example: Simple string with delimiters
                            // const qrString = `Ref: ${refId}\nMovie: ${itemTitle}\nVenue: ${venueName}\nScreen: ${screenName}\nTime: ${startTimeFormatted}\nSeats: ${seatsFormatted}\nAmount: Rs. ${amountPaidFormatted}`;

                            // Example: JSON string (more structured for parsing)
                            const qrDetails = {
                                bookingRefId: refId,
                                item: itemTitle,
                                venue: venueName,
                                screen: screenName,
                                dateTime: startTimeFormatted,
                                seats: seatsFormatted,
                                amount: `Rs. ${amountPaidFormatted}`
                            };
                            const qrString = JSON.stringify(qrDetails);
                            console.log("QR Code String:", qrString);
                            setQrCodeValue(qrString);
                        }
                        // --- End Construct QR Code Value ---
                    }
                }
            } catch (err) {
                console.error("Error fetching booking details:", err);
                if(isMounted){ setError(err.message || 'Failed to load booking details.'); setBooking(null); }
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };
        fetchBooking();
        return () => { isMounted = false; };
    }, [bookingId, user, isAuthLoading]); // Re-run if user context changes

    if (isLoading || isAuthLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!booking) return <Container sx={{ py: 4 }}><Alert severity="warning">Booking details could not be loaded.</Alert></Container>;

    // Extract details for display (already done in useEffect for QR code)
    const show = booking.showtime;
    const itemTitle = show?.movie?.title || show?.event?.title || 'Item';
    const venueName = show?.venue?.name || 'N/A';
    const screenName = show?.screenName || 'N/A';
    const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'N/A';
    const seats = booking.seats?.join(', ') || 'N/A';
    const amountPaid = booking.totalAmount?.toFixed(2);
    const displayBookingRefId = booking.bookingRefId || 'N/A'; // Use the 6-digit ID for display

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Booking Confirmed!
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Your tickets for **{itemTitle}** are confirmed.
                </Typography>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Booking Ref: <Box component="span" sx={{ color: 'error.main', userSelect: 'all' }}>{displayBookingRefId}</Box>
                </Typography>

                <Box sx={{ textAlign: 'left', mb: 3, border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="body1"><strong>Venue:</strong> {venueName}</Typography>
                    <Typography variant="body1"><strong>Screen:</strong> {screenName}</Typography>
                    <Typography variant="body1"><strong>Date & Time:</strong> {startTime}</Typography>
                    <Typography variant="body1"><strong>Seats:</strong> {seats}</Typography>
                    <Typography variant="body1"><strong>Amount Paid:</strong> Rs. {amountPaid}</Typography>
                     {booking.discountAmount > 0 && (
                         <Typography variant="body2" color="success.main">You saved Rs. {booking.discountAmount.toFixed(2)}!</Typography>
                     )}
                </Box>

                {/* Real QR Code */}
                <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <Typography variant="h6" gutterBottom>Your Ticket QR Code</Typography>
                     <Box sx={{ p: 1, bgcolor: 'white', border: '1px solid grey' }}>
                        {qrCodeValue ? ( // Only render QR code if value is ready
                            <QRCodeSVG
                                value={qrCodeValue} // Data encoded in QR
                                size={180}          // Size in pixels
                                level={"H"}         // Error correction level (L, M, Q, H)
                                bgColor={"#FFFFFF"}
                                fgColor={"#000000"}
                            />
                        ) : (
                            <Typography variant="caption" color="text.secondary">Generating QR...</Typography>
                        )}
                     </Box>
                     <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>
                         Show this at the venue entrance for check-in.
                     </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    A confirmation email has been sent to {booking.user?.email}. You can also view this booking in 'My Bookings'.
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button component={RouterLink} to="/my-bookings" variant="contained" color="error"> View My Bookings </Button>
                     <Button component={RouterLink} to="/" variant="outlined" color="error"> Back to Home </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default BookingConfirmationPage;
