// client/src/components/organizer/MyVenueBookingsOrganizer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getMyVenueBookingsApi } from '../../api/organizer'; // Fetches bookings for organizer's venues
import { getMyVenuesApi } from '../../api/organizer'; // To filter by venue
import { getMyShowtimesApi } from '../../api/organizer'; // To filter by showtime (optional advanced filter)
import {
    Box, Button, Typography, Paper, CircularProgress, Alert, Chip, Tooltip, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    TextField, Grid, Select, MenuItem, FormControl, InputLabel, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,Divider
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
// We might not give organizers cancel permission directly from here, that's usually admin or user self-service
// import CancelIcon from '@mui/icons-material/Cancel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const bookingStatuses = ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'];

const MyVenueBookingsOrganizer = () => {
    const [bookings, setBookings] = useState([]);
    const [myVenues, setMyVenues] = useState([]); // For venue filter dropdown
    // const [myShowtimes, setMyShowtimes] = useState([]); // Optional: for showtime filter dropdown

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalBookings, setTotalBookings] = useState(0);

    const [filters, setFilters] = useState({
        venueId: '', // Filter by one of their venues
        showtimeId: '', // Filter by a specific showtime
        date: null, // Filter by booking date OR showtime date (decide which is more useful)
        status: '',
        bookingRefId: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const venuesData = await getMyVenuesApi();
            setMyVenues(Array.isArray(venuesData) ? venuesData : []);
            // Optionally fetch all their showtimes for a more granular filter, or fetch on demand
            // const showtimesData = await getMyShowtimesApi();
            // setMyShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
            await fetchBookings(0, rowsPerPage, filters); // Fetch bookings with default/current filters
        } catch (err) {
            setError(err.message || "Failed to load initial data for booking view.");
        } finally {
            // setIsLoading is handled by fetchBookings
        }
    }, []); // Dependencies will be added when fetchBookings is defined

    const fetchBookings = useCallback(async (currentPage, currentRowsPerPage, currentFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = {
                limit: currentRowsPerPage,
                page: currentPage + 1,
            };
            if (currentFilters.venueId) params.venueId = currentFilters.venueId;
            if (currentFilters.showtimeId) params.showtimeId = currentFilters.showtimeId; // Backend needs to support this
            if (currentFilters.status) params.status = currentFilters.status;
            if (currentFilters.bookingRefId) params.bookingRefId = currentFilters.bookingRefId.toUpperCase();
            if (currentFilters.date) params.date = dayjs(currentFilters.date).format('YYYY-MM-DD'); // Ensure backend supports this date filter for organizer bookings

            const response = await getMyVenueBookingsApi(params);
            setBookings(response.data || response || []); // Backend might return array directly or {data: []}
            setTotalBookings(response.total || (response && response.length) || 0);
        } catch (err) {
            setError(err.message || 'Failed to load bookings.');
            setBookings([]);
            setTotalBookings(0);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);


    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateFilterChange = (newDate) => {
        setFilters(prev => ({ ...prev, date: newDate }));
    };

    const handleApplyFilters = () => {
        setPage(0);
        fetchBookings(0, rowsPerPage, filters);
    };
    
    const handleClearFilters = () => {
        setFilters({ venueId: '', showtimeId: '', date: null, status: '', bookingRefId: '' });
        setPage(0);
        // fetchBookings will re-trigger via useEffect when filters change if it's a dependency,
        // or call it explicitly:
        fetchBookings(0, rowsPerPage, { venueId: '', showtimeId: '', date: null, status: '', bookingRefId: '' });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        fetchBookings(newPage, rowsPerPage, filters);
    };

    const handleChangeRowsPerPage = (event) => {
        const newRowsPerPage = parseInt(event.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setPage(0);
        fetchBookings(0, newRowsPerPage, filters);
    };

    // For organizer, view details might be slightly different from admin's full booking view
    // It could use the same getBookingByIdApi if permissions are handled by backend,
    // or a specific organizer endpoint if data needs to be scoped.
    // For now, let's assume an organizer might not need ALL details like an admin.
    const handleViewDetails = (booking) => { // Pass the whole booking object
        setSelectedBookingDetails(booking); // Use the already fetched booking data for the modal
        setDetailsModalOpen(true);
    };
    
    const getStatusChipColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'success';
            case 'checkedin': return 'primary';
            case 'paymentpending': return 'warning';
            case 'cancelled': return 'error';
            case 'paymentfailed': return 'error';
            default: return 'default';
        }
    };

    if (isLoading && bookings.length === 0 && !detailsModalOpen) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>;
    if (error && !detailsModalOpen) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Bookings for My Venues</Typography>
            
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Venue</InputLabel>
                            <Select name="venueId" value={filters.venueId} label="Filter by Venue" onChange={handleFilterChange}>
                                <MenuItem value=""><em>All My Venues</em></MenuItem>
                                {myVenues.map(venue => (
                                    <MenuItem key={venue._id} value={venue._id}>{venue.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField name="bookingRefId" label="Booking Ref ID" value={filters.bookingRefId} onChange={handleFilterChange} fullWidth size="small"/>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DatePicker label="Showtime/Booking Date" value={filters.date} onChange={handleDateFilterChange} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select name="status" value={filters.status} label="Status" onChange={handleFilterChange}>
                                <MenuItem value=""><em>Any</em></MenuItem>
                                {bookingStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Button onClick={handleApplyFilters} variant="contained" size="medium">Apply</Button>
                        <Button onClick={handleClearFilters} variant="outlined" size="medium">Clear</Button>
                    </Grid>
                </Grid>
            </Paper>

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={30} color="error" /></Box>}
            {!isLoading && bookings.length === 0 && <Typography sx={{p:2, textAlign: 'center'}}>No bookings found matching your criteria for your venues.</Typography>}
            
            {bookings.length > 0 && (
                <Paper elevation={0} variant="outlined">
                    <TableContainer>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Ref ID</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>User</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Item (Movie/Event)</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Venue & Screen</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Showtime</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Seats</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Amount</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Status</TableCell>
                                    <TableCell sx={{fontWeight: 'bold', textAlign:'center'}}>View</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow hover key={booking._id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">{booking.bookingRefId || booking._id.slice(-6)}</Typography>
                                        </TableCell>
                                        <TableCell>{booking.user?.name || 'N/A'}<br/><Typography variant="caption">{booking.user?.email}</Typography></TableCell>
                                        <TableCell>{booking.showtime?.movie?.title || booking.showtime?.event?.title || 'N/A'}</TableCell>
                                        <TableCell>{booking.showtime?.venue?.name}<br/><Typography variant="caption">Screen: {booking.showtime?.screenName}</Typography></TableCell>
                                        <TableCell>{dayjs(booking.showtime?.startTime).format('DD MMM, HH:mm')}</TableCell>
                                        <TableCell>{(booking.seats || []).join(', ')}</TableCell>
                                        <TableCell>Rs. {booking.totalAmount?.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={booking.status} 
                                                size="small" 
                                                color={getStatusChipColor(booking.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{textAlign:'center'}}>
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleViewDetails(booking)} size="small">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={totalBookings}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>
            )}

            {/* Booking Details Modal for Organizer */}
            <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Booking Details (Ref: {selectedBookingDetails?.bookingRefId || selectedBookingDetails?._id.slice(-6)})</DialogTitle>
                <DialogContent dividers>
                    {selectedBookingDetails && (
                        <Grid container spacing={1}>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">User Name:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.user?.name}</Typography></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">User Email:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.user?.email}</Typography></Grid>
                            <Grid item xs={12}><Divider sx={{my:1}}/></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Item:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.showtime?.movie?.title || selectedBookingDetails.showtime?.event?.title}</Typography></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Venue:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.showtime?.venue?.name}</Typography></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Screen:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.showtime?.screenName}</Typography></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Showtime:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{dayjs(selectedBookingDetails.showtime?.startTime).format('DD MMM YYYY, HH:mm A')}</Typography></Grid>
                            <Grid item xs={12}><Divider sx={{my:1}}/></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Seats Booked:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{(selectedBookingDetails.seats || []).join(', ')}</Typography></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Total Amount:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2" fontWeight="bold">Rs. {selectedBookingDetails.totalAmount?.toFixed(2)}</Typography></Grid>
                             {selectedBookingDetails.promoCodeApplied && (
                                <>
                                <Grid item xs={5}><Typography variant="body2" color="text.secondary">Promo Applied:</Typography></Grid>
                                <Grid item xs={7}><Typography variant="body2">{selectedBookingDetails.promoCodeApplied?.code} (Discount: Rs. {selectedBookingDetails.discountAmount?.toFixed(2)})</Typography></Grid>
                                </>
                            )}
                            <Grid item xs={12}><Divider sx={{my:1}}/></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Booking Status:</Typography></Grid>
                            <Grid item xs={7}><Chip label={selectedBookingDetails.status} size="small" color={getStatusChipColor(selectedBookingDetails.status)}/></Grid>
                            <Grid item xs={5}><Typography variant="body2" color="text.secondary">Booked On:</Typography></Grid>
                            <Grid item xs={7}><Typography variant="body2">{dayjs(selectedBookingDetails.bookingTime).format('DD MMM YYYY, HH:mm')}</Typography></Grid>
                            {selectedBookingDetails.isCheckedIn && (
                                <>
                                <Grid item xs={5}><Typography variant="body2" color="text.secondary">Checked In:</Typography></Grid>
                                <Grid item xs={7}><Typography variant="body2">{dayjs(selectedBookingDetails.checkInTime).format('DD MMM YYYY, HH:mm')}</Typography></Grid>
                                </>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyVenueBookingsOrganizer;