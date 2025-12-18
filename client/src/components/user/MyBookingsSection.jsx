// client/src/components/user/MyBookingsSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMyBookingsApi, cancelBookingApi } from '../../api/bookings';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';

import {
    Typography, Box, Paper, List, ListItem, ListItemText, Divider,
    CircularProgress, Alert, Chip, Button, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Tabs, Tab
} from '@mui/material';

// Helper component for tab content
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`booking-tabpanel-${index}`}
            aria-labelledby={`booking-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

// Reusable component for rendering a single booking item
const BookingItem = ({ booking, onCancelClick }) => {
    const show = booking.showtime;
    const itemTitle = show?.movie?.title || show?.event?.title || 'Item Title Unavailable';
    const itemPoster = show?.movie?.posterUrl || show?.event?.imageUrl;
    const venueName = show?.venue?.name || 'Venue N/A';
    const startTime = show?.startTime ? dayjs(show.startTime).format('ddd, DD MMM YYYY, h:mm A') : 'Time N/A';
    const displayBookingId = booking.bookingRefId || booking._id;
    const isShowtimeInPast = dayjs(show?.startTime).isBefore(dayjs());

    const isCancellable = (booking) => {
        if (booking.status !== 'Confirmed') return false;
        const twoHoursInMillis = 2 * 60 * 60 * 1000;
        return dayjs(booking.showtime?.startTime).diff(dayjs()) > twoHoursInMillis;
    };

    const getStatusChipColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return isShowtimeInPast ? 'primary' : 'success';
            case 'checkedin': return 'primary';
            case 'paymentpending': return 'warning';
            case 'cancelled':
            case 'paymentfailed': return 'error';
            default: return 'default';
        }
    };
    
    // Determine the label for the chip
    let statusLabel = booking.status;
    if (booking.status === 'Confirmed' && isShowtimeInPast) {
        statusLabel = 'Completed';
    } else if (booking.status === 'PaymentPending' && isShowtimeInPast) {
        // Visually represent this as failed in the UI if it ends up in the failed tab
        statusLabel = 'Payment Failed';
    }


    return (
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
            <Box sx={{ ml: { sm: 2 }, textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0, width: {xs: '100%', sm: 'auto'} }}>
                <Chip label={statusLabel} color={getStatusChipColor(booking.status)} size="small" sx={{ mb: 1.5 }} />
                <Button variant="outlined" size="small" component={RouterLink} to={`/booking-confirmation/${displayBookingId}`} sx={{ display: 'block', width: '100%', mb: 1 }}>View Details / QR</Button>
                {isCancellable(booking) && (
                    <Button variant="text" color="error" size="small" sx={{ display: 'block', width: '100%' }} onClick={() => onCancelClick(booking)}>Cancel Booking</Button>
                )}
            </Box>
        </ListItem>
    );
};


const MyBookingsSection = () => {
    const [allBookings, setAllBookings] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [pastBookings, setPastBookings] = useState([]);
    const [failedOrCancelledBookings, setFailedOrCancelledBookings] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState(0);

    const fetchAndCategorizeBookings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getMyBookingsApi();
            setAllBookings(data);

            const now = dayjs();
            const upcoming = [];
            const past = [];
            const failed = [];

            data.forEach(booking => {
                const isShowtimeInPast = dayjs(booking.showtime?.startTime).isBefore(now);

                if (booking.status === 'Cancelled' || booking.status === 'PaymentFailed') {
                    failed.push(booking);
                } else if (booking.status === 'PaymentPending' && isShowtimeInPast) {
                    // Treat pending payments for past shows as failed
                    failed.push(booking);
                } else if (isShowtimeInPast) {
                    // Includes 'Confirmed' and 'CheckedIn' for past shows
                    past.push(booking);
                } else {
                    // Includes 'Confirmed' and 'PaymentPending' for future shows
                    upcoming.push(booking);
                }
            });

            // Sort each category
            setUpcomingBookings(upcoming.sort((a, b) => dayjs(a.showtime?.startTime).valueOf() - dayjs(b.showtime?.startTime).valueOf()));
            setPastBookings(past.sort((a, b) => dayjs(b.showtime?.startTime).valueOf() - dayjs(a.showtime?.startTime).valueOf()));
            setFailedOrCancelledBookings(failed.sort((a, b) => dayjs(b.bookingTime).valueOf() - dayjs(a.bookingTime).valueOf()));

        } catch (err) {
            setError(err.message || 'Failed to load your bookings.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAndCategorizeBookings();
    }, [fetchAndCategorizeBookings]);

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
            fetchAndCategorizeBookings(); // Refetch and re-categorize all bookings
        } catch (err) {
            alert(`Cancellation failed: ${err.msg || err.message}`);
        } finally {
            handleCloseCancelDialog();
        }
    };
    
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
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

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="booking history tabs">
                    <Tab label="Upcoming" />
                    <Tab label="Past Bookings" />
                    <Tab label="Cancelled / Failed" />
                </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
                {upcomingBookings.length > 0 ? (
                    <Paper elevation={0} variant="outlined">
                        <List disablePadding>
                            {upcomingBookings.map((booking, index) => (
                                <React.Fragment key={booking._id}>
                                    <BookingItem booking={booking} onCancelClick={handleOpenCancelDialog} />
                                    {index < upcomingBookings.length - 1 && <Divider component="li" variant="inset" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>You have no upcoming bookings.</Typography>
                )}
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                 {pastBookings.length > 0 ? (
                    <Paper elevation={0} variant="outlined">
                        <List disablePadding>
                            {pastBookings.map((booking, index) => (
                                <React.Fragment key={booking._id}>
                                    <BookingItem booking={booking} onCancelClick={() => {}} />
                                    {index < pastBookings.length - 1 && <Divider component="li" variant="inset" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>No past bookings found.</Typography>
                )}
            </TabPanel>
            
            <TabPanel value={currentTab} index={2}>
                 {failedOrCancelledBookings.length > 0 ? (
                    <Paper elevation={0} variant="outlined">
                        <List disablePadding>
                            {failedOrCancelledBookings.map((booking, index) => (
                                <React.Fragment key={booking._id}>
                                    <BookingItem booking={booking} onCancelClick={() => {}} />
                                    {index < failedOrCancelledBookings.length - 1 && <Divider component="li" variant="inset" />}
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>No cancelled or failed bookings.</Typography>
                )}
            </TabPanel>
            
            {allBookings.length === 0 && !isLoading && (
                 <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center', mt: 2 }}>
                    <Typography color="text.secondary">You haven't made any bookings yet.</Typography>
                    <Button component={RouterLink} to="/" variant="contained" color="error" sx={{ mt: 2 }}>
                        Book Tickets Now
                    </Button>
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