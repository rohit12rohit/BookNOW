// client/src/components/user/MyBookingsSection.jsx
import React, { useState, useEffect } from 'react';
import { getMyBookingsApi, cancelBookingApi } from '../../api/bookings';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';

import {
    Typography, Box, Paper, List, ListItem, ListItemText, Divider,
    CircularProgress, Alert, Chip, Button, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle
} from '@mui/material';

const MyBookingsSection = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

    const fetchBookings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyBookingsApi();
            const sortedBookings = data.sort((a, b) =>
                dayjs(b.showtime?.startTime || 0).valueOf() - dayjs(a.showtime?.startTime || 0).valueOf()
            );
            setBookings(sortedBookings);
        } catch (err) {
            setError(err.message || 'Failed to load your bookings.');
            setBookings([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

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
            fetchBookings();
        } catch (err) {
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

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Booking History</Typography>
            {bookings.length === 0 ? (
                <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">You haven't made any bookings yet.</Typography>
                    <Button component={RouterLink} to="/" variant="contained" color="error" sx={{ mt: 2 }}>
                        Book Tickets Now
                    </Button>
                </Paper>
            ) : (
                <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {bookings.map((booking, index) => {
                            const show = booking.showtime;
                            const itemTitle = show?.movie?.title || show?.event?.title || 'Item Title Unavailable';
                            const itemPoster = show?.movie?.posterUrl;
                            const venueName = show?.venue?.name || 'Venue N/A';
                            const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'Time N/A';
                            const displayBookingId = booking.bookingRefId || booking._id;

                            return (
                                <React.Fragment key={booking._id}>
                                    <ListItem sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', py: 2.5, px: 2.5 }}>
                                        {itemPoster && (
                                            <Box sx={{ width: { xs: 80, sm: 100 }, height: { xs: 120, sm: 150 }, mr: 2.5, mb: { xs: 2, sm: 0 }, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                                                <img src={itemPoster} alt={itemTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </Box>
                                        )}
                                        <ListItemText
                                            primary={<Typography variant="h6" component="span" sx={{ fontWeight: 'medium' }}>{itemTitle}</Typography>}
                                            secondary={
                                                <>
                                                    <Typography component="span" variant="body2" color="text.primary" display="block" sx={{ fontWeight: 'bold', my: 0.5 }}>Ref ID: {displayBookingId}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Venue: {venueName}</Typography>
                                                    <Typography component="span" variant="body2" color="text.secondary" display="block">Date: {startTime}</Typography>
                                                </>
                                            } sx={{ mb: { xs: 2, sm: 0 }, flexGrow: 1 }}
                                        />
                                        <Box sx={{ ml: { sm: 2 }, textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
                                            <Chip label={booking.status || 'Unknown'} color={getStatusChipColor(booking.status)} size="small" sx={{ mb: 1.5 }} />
                                            <Button variant="outlined" size="small" component={RouterLink} to={`/booking-confirmation/${displayBookingId}`} sx={{ display: 'block', width: '100%', mb: 1 }}>View Details / QR</Button>
                                            {isCancellable(booking) && (
                                                <Button variant="text" color="error" size="small" sx={{ display: 'block', width: '100%' }} onClick={() => handleOpenCancelDialog(booking)}>Cancel Booking</Button>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < bookings.length - 1 && <Divider component="li" variant="inset" />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                </Paper>
            )}
            <Dialog open={isCancelConfirmOpen} onClose={handleCloseCancelDialog}>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to cancel this booking? This action cannot be undone.</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCancelDialog}>Back</Button>
                    <Button onClick={handleConfirmCancel} color="error" autoFocus>Confirm</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyBookingsSection;