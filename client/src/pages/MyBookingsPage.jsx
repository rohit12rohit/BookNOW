// File: /client/src/pages/MyBookingsPage.jsx
// Displays a list of the logged-in user's bookings.
import React, { useState, useEffect } from 'react';
import { getMyBookingsApi, cancelBookingApi } from '../api/bookings'; // API function to fetch and cancel bookings
import { useAuth } from '../contexts/AuthContext'; // Hook to get user auth state
import dayjs from 'dayjs'; // Library for easy date formatting
import { Link as RouterLink } from 'react-router-dom'; // For linking to details

// MUI Components for UI
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const MyBookingsPage = () => {
    // State for bookings, loading status, and errors
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    // Get authentication status from context
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    // Effect to fetch bookings when the component mounts or auth status changes
    const fetchBookings = async () => {
        console.log("[MyBookingsPage] Auth confirmed, fetching bookings...");
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyBookingsApi(); // Call the API
            const sortedBookings = data.sort((a, b) =>
                dayjs(b.showtime?.startTime || 0).valueOf() - dayjs(a.showtime?.startTime || 0).valueOf()
            );
            setBookings(sortedBookings);
        } catch (err) {
            console.error("[MyBookingsPage] Error fetching bookings:", err);
            setError(err.message || 'Failed to load your bookings.');
            setBookings([]); // Clear bookings on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            fetchBookings();
        } else if (!isAuthLoading && !isAuthenticated) {
            setError("Please login to view your bookings.");
            setIsLoading(false);
            setBookings([]);
        }
    }, [isAuthenticated, isAuthLoading]);

    const handleOpenCancelDialog = (booking) => {
        setBookingToCancel(booking);
        setIsCancelConfirmOpen(true);
    };

    const handleCloseCancelDialog = () => {
        setBookingToCancel(null);
        setIsCancelConfirmOpen(false);
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel) return;
        try {
            await cancelBookingApi(bookingToCancel._id);
            // Refresh the bookings list to show the updated status
            fetchBookings(); 
        } catch (err) {
            // Display error to the user
            alert(`Cancellation failed: ${err.msg || err.message}`);
        } finally {
            handleCloseCancelDialog();
        }
    };

    const isCancellable = (booking) => {
        if (booking.status !== 'Confirmed') return false;
        const twoHoursInMillis = 2 * 60 * 60 * 1000;
        return dayjs(booking.showtime?.startTime).diff(dayjs()) > twoHoursInMillis;
    };

    const getStatusChipColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'success';
            case 'checkedin': return 'primary';
            case 'paymentpending': return 'warning';
            case 'cancelled':
            case 'paymentfailed': return 'error';
            default: return 'default';
        }
    };

    if (isLoading || isAuthLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }

    if (error) {
        return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
                My Bookings
            </Typography>

            {bookings.length === 0 ? (
                <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't made any bookings yet.</Typography>
                    <Button component={RouterLink} to="/" variant="contained" color="error" sx={{ mt: 2 }}>
                        Book Tickets Now
                    </Button>
                </Paper>
            ) : (
                <Paper elevation={1}>
                    <List disablePadding>
                        {bookings.map((booking, index) => {
                            const show = booking.showtime;
                            const itemTitle = show?.movie?.title || show?.event?.title || 'Item Title Unavailable';
                            const itemPoster = show?.movie?.posterUrl;
                            const venueName = show?.venue?.name || 'Venue N/A';
                            const screenName = show?.screenName || 'N/A';
                            const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'Time N/A';
                            const seats = booking.seats?.join(', ') || 'N/A';
                            const displayBookingId = booking.bookingRefId || booking._id;

                            return (
                                <React.Fragment key={booking._id}>
                                    <ListItem sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        alignItems: 'flex-start',
                                        py: 2.5,
                                        px: { xs: 1.5, sm: 2.5 }
                                    }}>
                                        {itemPoster && (
                                            <Box sx={{
                                                width: { xs: '100%', sm: 80, md: 100 },
                                                height: { xs: 150, sm: 120, md: 150 },
                                                mr: { sm: 2.5 },
                                                mb: { xs: 2, sm: 0 },
                                                flexShrink: 0,
                                                bgcolor: 'grey.200',
                                                borderRadius: 1,
                                                overflow: 'hidden'
                                            }}>
                                                <img
                                                    src={itemPoster}
                                                    alt={itemTitle}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display='none'; }}
                                                />
                                            </Box>
                                        )}

                                        <ListItemText
                                            primary={
                                                <Typography variant="h6" component="span" sx={{ fontWeight: 'medium', display: 'block', mb: 0.5 }}>
                                                    {itemTitle}
                                                </Typography>
                                            }
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary" display="block" sx={{fontWeight: 'bold', mb: 0.5}}>
                                                        Ref ID: {displayBookingId}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Venue: {venueName}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Screen: {screenName} | Seats: {seats}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Date: {startTime}</Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary" display="block">Booked on: {dayjs(booking.bookingTime).format('DD MMM YYYY')}</Typography>
                                                    <Typography component="span" variant="body2" color="text.primary" display="block" sx={{mt: 1}}>
                                                        Amount Paid: Rs. {booking.totalAmount?.toFixed(2)}
                                                        {booking.discountAmount > 0 && ` (Saved Rs. ${booking.discountAmount.toFixed(2)})`}
                                                    </Typography>
                                                </>
                                            }
                                            sx={{ mb: { xs: 2, sm: 0 } }}
                                        />

                                        <Box sx={{
                                            mt: { xs: 1, sm: 0 },
                                            ml: { sm: 2 },
                                            textAlign: { xs: 'left', sm: 'right' },
                                            flexShrink: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: {xs: 'flex-start', sm: 'flex-end'}
                                        }}>
                                            <Chip
                                                label={booking.status || 'Unknown'}
                                                color={getStatusChipColor(booking.status)}
                                                size="small"
                                                sx={{ mb: 1.5, width: 'fit-content' }}
                                            />
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                component={RouterLink}
                                                to={`/booking-confirmation/${booking.bookingRefId || booking._id}`}
                                                sx={{display: 'block', width: '100%', mb: 1}}
                                            >
                                                View Details / QR
                                            </Button>
                                            {isCancellable(booking) && (
                                                <Button 
                                                    variant="text" 
                                                    color="error" 
                                                    size="small" 
                                                    sx={{display: 'block', width: '100%'}}
                                                    onClick={() => handleOpenCancelDialog(booking)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < bookings.length - 1 && <Divider component="li" variant="middle"/>}
                                </React.Fragment>
                            )
                        })}
                    </List>
                </Paper>
            )}

            {/* Confirmation Dialog for Cancellation */}
            <Dialog
                open={isCancelConfirmOpen}
                onClose={handleCloseCancelDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Cancellation"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCancelDialog}>Back</Button>
                    <Button onClick={handleConfirmCancel} color="error" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default MyBookingsPage;