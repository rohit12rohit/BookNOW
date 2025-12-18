// client/src/pages/BookingConfirmationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getBookingByIdApi } from '../api/bookings';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { PDFDownloadLink } from '@react-pdf/renderer';

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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DownloadIcon from '@mui/icons-material/Download';

// Import QR Code and Ticket Components
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import TicketDocument from '../components/TicketDocument';

const BookingConfirmationPage = () => {
    const { bookingId } = useParams();
    const { user, isLoading: isAuthLoading } = useAuth();
    const [booking, setBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [qrCodeValue, setQrCodeValue] = useState('');
    const [qrCodeDataURL, setQrCodeDataURL] = useState('');
    const qrCanvasRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const fetchBooking = async () => {
            if (!bookingId) { if(isMounted){ setError("Booking ID missing."); setIsLoading(false); } return; }
            if (isAuthLoading) { return; }
            if (!user) { if(isMounted){ setError("User not authenticated."); setIsLoading(false); } return; }

            if(isMounted){ setIsLoading(true); setError(null); }
            try {
                const data = await getBookingByIdApi(bookingId);
                if (isMounted) {
                    if (data?.user?._id !== user?._id && user?.role !== 'admin') {
                        setError("Unauthorized to view this booking's details.");
                        setBooking(null);
                    } else {
                        setBooking(data);
                        if (data && (data.status === 'Confirmed' || data.status === 'CheckedIn')) {
                            setQrCodeValue(data.qrCodeData || '');
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching booking details:", err);
                if(isMounted){ setError(err.msg || err.message || 'Failed to load booking details.'); setBooking(null); }
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };
        fetchBooking();
        return () => { isMounted = false; };
    }, [bookingId, user, isAuthLoading]);

    // Effect to generate QR code data URL from canvas for PDF
    useEffect(() => {
        if (qrCodeValue && qrCanvasRef.current) {
            const canvas = qrCanvasRef.current;
            // A short delay ensures canvas has time to render before we grab the data URL
            setTimeout(() => {
                const dataUrl = canvas.toDataURL('image/png');
                setQrCodeDataURL(dataUrl);
            }, 100);
        }
    }, [qrCodeValue]);

    if (isLoading || isAuthLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!booking) return <Container sx={{ py: 4 }}><Alert severity="warning">Booking details could not be loaded.</Alert></Container>;

    const isConfirmed = booking.status === 'Confirmed' || booking.status === 'CheckedIn';

    const show = booking.showtime;
    const itemTitle = show?.movie?.title || show?.event?.title || 'Item';
    const venueName = show?.venue?.name || 'N/A';
    const screenName = show?.screenName || 'N/A';
    const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'N/A';
    const seats = booking.seats?.join(', ') || 'N/A';
    const amountPaid = booking.totalAmount?.toFixed(2);
    const displayBookingRefId = booking.bookingRefId || 'N/A';

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}>
                {isConfirmed ? (
                    <>
                        <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Booking Confirmed!
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            Your tickets for **{itemTitle}** are ready.
                        </Typography>
                    </>
                ) : (
                    <>
                        <ErrorOutlineIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Booking Not Confirmed
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            The status of this booking is: **{booking.status}**
                        </Typography>
                    </>
                )}

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Booking Ref: <Box component="span" sx={{ color: 'error.main', userSelect: 'all' }}>{displayBookingRefId}</Box>
                </Typography>

                <Box sx={{ textAlign: 'left', mb: 3, border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <Typography variant="body1"><strong>Venue:</strong> {venueName}</Typography>
                    <Typography variant="body1"><strong>Screen:</strong> {screenName}</Typography>
                    <Typography variant="body1"><strong>Date & Time:</strong> {startTime}</Typography>
                    <Typography variant="body1"><strong>Seats:</strong> {seats}</Typography>
                    <Typography variant="body1"><strong>Total Amount:</strong> Rs. {amountPaid}</Typography>
                     {booking.discountAmount > 0 && (
                         <Typography variant="body2" color="success.main">You saved Rs. {booking.discountAmount.toFixed(2)}!</Typography>
                     )}
                </Box>

                {isConfirmed && qrCodeValue && (
                    <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <Typography variant="h6" gutterBottom>Your Ticket QR Code</Typography>
                         <Box sx={{ p: 1, bgcolor: 'white', border: '1px solid grey' }}>
                            <QRCodeSVG
                                value={qrCodeValue}
                                size={220}
                                level={"H"}
                            />
                         </Box>
                         <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>
                             Show this at the venue entrance for check-in.
                         </Typography>
                         {/* Hidden canvas for generating PDF image data */}
                         <QRCodeCanvas
                            ref={qrCanvasRef}
                            value={qrCodeValue}
                            size={256}
                            style={{ display: 'none' }}
                        />
                    </Box>
                )}

                {!isConfirmed && (
                    <Alert severity="warning" sx={{ mb: 3, textAlign: 'left' }}>
                        {booking.status === 'PaymentPending' && "Your payment for this booking is incomplete. Please go to 'My Bookings' to retry payment if the session is still active."}
                        {booking.status === 'PaymentFailed' && "The payment for this booking failed. Your seats were released. Please try booking again."}
                        {booking.status === 'Cancelled' && "This booking has been cancelled."}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {isConfirmed && qrCodeDataURL ? (
                        <PDFDownloadLink
                            document={<TicketDocument booking={booking} qrCodeDataURL={qrCodeDataURL} />}
                            fileName={`BookNOW_Ticket_${displayBookingRefId}.pdf`}
                            style={{ textDecoration: 'none' }}
                        >
                            {({ loading }) => (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                                >
                                    {loading ? 'Generating...' : 'Download Ticket'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    ) : isConfirmed ? (
                        <Button variant="contained" color="secondary" disabled>
                            <CircularProgress size={20} color="inherit" />
                        </Button>
                    ) : null}

                    <Button component={RouterLink} to="/dashboard?tab=bookings" variant="contained" color="error"> View My Bookings </Button>
                     <Button component={RouterLink} to="/" variant="outlined" color="error"> Back to Home </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default BookingConfirmationPage;