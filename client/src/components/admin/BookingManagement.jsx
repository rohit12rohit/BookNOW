// client/src/components/admin/BookingManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllBookingsAdminApi, getBookingByIdAdminApi, cancelAnyBookingAdminApi } from '../../api/admin';
import {
    Box, Button, Typography, Paper, CircularProgress, Alert, Chip, Tooltip, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
    TextField, Grid, Select, MenuItem, FormControl, InputLabel, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const bookingStatuses = ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'];

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalBookings, setTotalBookings] = useState(0);
    const [filters, setFilters] = useState({
        userId: '',
        showtimeId: '', // Could expand to movie/event/venue IDs later if needed for more complex filtering
        date: null, // For bookingTime
        status: '',
        bookingRefId: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState(null);


    const fetchBookings = useCallback(async (currentPage, currentRowsPerPage, currentFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = {
                limit: currentRowsPerPage,
                page: currentPage + 1,
            };
            if (currentFilters.userId) params.userId = currentFilters.userId;
            if (currentFilters.showtimeId) params.showtimeId = currentFilters.showtimeId;
            if (currentFilters.status) params.status = currentFilters.status;
            if (currentFilters.bookingRefId) params.bookingRefId = currentFilters.bookingRefId.toUpperCase();
            if (currentFilters.date) params.date = dayjs(currentFilters.date).format('YYYY-MM-DD');


            const response = await getAllBookingsAdminApi(params);
            setBookings(response.data || []);
            setTotalBookings(response.total || 0);
        } catch (err) {
            setError(err.message || 'Failed to load bookings.');
            setBookings([]);
            setTotalBookings(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings(page, rowsPerPage, filters);
    }, [fetchBookings, page, rowsPerPage, filters]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateFilterChange = (newDate) => {
        setFilters(prev => ({ ...prev, date: newDate }));
    };

    const handleApplyFilters = () => {
        setPage(0); // Reset to first page when filters change
        fetchBookings(0, rowsPerPage, filters);
    };
    
    const handleClearFilters = () => {
        setFilters({ userId: '', showtimeId: '', date: null, status: '', bookingRefId: '' });
        setPage(0);
        // fetchBookings will be called by useEffect due to filters changing
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewDetails = async (bookingId) => {
        try {
            setIsLoading(true); // Show loading for modal fetch
            const details = await getBookingByIdAdminApi(bookingId);
            setSelectedBookingDetails(details);
            setDetailsModalOpen(true);
        } catch (err) {
            setError(err.message || "Failed to fetch booking details.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCancelClick = (booking) => {
        setBookingToCancel(booking);
        setCancelConfirmOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!bookingToCancel) return;
        try {
            await cancelAnyBookingAdminApi(bookingToCancel._id);
            fetchBookings(page, rowsPerPage, filters); // Refresh list
            // If the detailed view modal is open for this booking, update its status or close it
            if (selectedBookingDetails && selectedBookingDetails._id === bookingToCancel._id) {
                setSelectedBookingDetails(prev => ({ ...prev, status: 'Cancelled' }));
            }
        } catch (err) {
            alert(`Failed to cancel booking: ${err.message || 'Server error'}`);
        } finally {
            setCancelConfirmOpen(false);
            setBookingToCancel(null);
        }
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
    // Don't show main list error if modal is open and loading details
    if (error && !detailsModalOpen) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{p:1}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6">Booking Management</Typography>
                <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </Box>

            <Collapse in={showFilters}>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="bookingRefId" label="Booking Ref ID" value={filters.bookingRefId} onChange={handleFilterChange} fullWidth size="small"/>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField name="userId" label="User ID" value={filters.userId} onChange={handleFilterChange} fullWidth size="small"/>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker label="Booking Date" value={filters.date} onChange={handleDateFilterChange} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select name="status" value={filters.status} label="Status" onChange={handleFilterChange}>
                                    <MenuItem value=""><em>Any</em></MenuItem>
                                    {bookingStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button onClick={handleClearFilters} variant="outlined" size="medium">Clear</Button>
                            <Button onClick={handleApplyFilters} variant="contained" size="medium">Apply Filters</Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Collapse>

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={30} color="error" /></Box>}
            {!isLoading && bookings.length === 0 && <Typography sx={{p:2, textAlign: 'center'}}>No bookings found matching your criteria.</Typography>}
            
            {bookings.length > 0 && (
                <Paper elevation={0} variant="outlined">
                    <TableContainer>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Ref ID</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>User</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Item</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Showtime</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Amount</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Status</TableCell>
                                    <TableCell sx={{fontWeight: 'bold', textAlign:'center'}}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow hover key={booking._id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">{booking.bookingRefId || booking._id.slice(-6)}</Typography>
                                        </TableCell>
                                        <TableCell>{booking.user?.name || booking.user?.email || 'N/A'}</TableCell>
                                        <TableCell>{booking.showtime?.movie?.title || booking.showtime?.event?.title || 'N/A'}</TableCell>
                                        <TableCell>{dayjs(booking.showtime?.startTime).format('DD MMM, HH:mm')}</TableCell>
                                        <TableCell>Rs. {booking.totalAmount?.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={booking.status} 
                                                size="small" 
                                                color={getStatusChipColor(booking.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{textAlign:'center', whiteSpace: 'nowrap'}}>
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleViewDetails(booking._id)} size="small">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {booking.status === 'Confirmed' && (
                                                <Tooltip title="Cancel Booking">
                                                    <IconButton onClick={() => handleCancelClick(booking)} size="small" color="error">
                                                        <CancelIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
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

            {/* Booking Details Modal */}
            <Dialog open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Booking Details (Ref: {selectedBookingDetails?.bookingRefId || selectedBookingDetails?._id.slice(-6)})</DialogTitle>
                <DialogContent dividers>
                    {isLoading && detailsModalOpen && <CircularProgress />}
                    {error && detailsModalOpen && <Alert severity="error">{error}</Alert>}
                    {selectedBookingDetails && !isLoading && (
                        <Grid container spacing={1}>
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">User:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.user?.name} ({selectedBookingDetails.user?.email})</Typography></Grid>
                            
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Item:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.showtime?.movie?.title || selectedBookingDetails.showtime?.event?.title}</Typography></Grid>

                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Venue:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.showtime?.venue?.name}</Typography></Grid>

                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Screen:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.showtime?.screenName}</Typography></Grid>

                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Showtime:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{dayjs(selectedBookingDetails.showtime?.startTime).format('DD MMM YYYY, HH:mm A')}</Typography></Grid>
                            
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Seats:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{(selectedBookingDetails.seats || []).join(', ')}</Typography></Grid>

                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Original Amount:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">Rs. {selectedBookingDetails.originalAmount?.toFixed(2)}</Typography></Grid>
                            
                            {selectedBookingDetails.promoCodeApplied && (
                                <>
                                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Promo Code:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.promoCodeApplied?.code}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Discount:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2">Rs. {selectedBookingDetails.discountAmount?.toFixed(2)}</Typography></Grid>
                                </>
                            )}
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary" fontWeight="bold">Total Paid:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Rs. {selectedBookingDetails.totalAmount?.toFixed(2)}</Typography></Grid>

                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Status:</Typography></Grid>
                            <Grid item xs={6}><Chip label={selectedBookingDetails.status} size="small" color={getStatusChipColor(selectedBookingDetails.status)}/></Grid>
                            
                            <Grid item xs={6}><Typography variant="body2" color="text.secondary">Booked On:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2">{dayjs(selectedBookingDetails.bookingTime).format('DD MMM YYYY, HH:mm')}</Typography></Grid>

                            {selectedBookingDetails.isCheckedIn && (
                                <>
                                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Checked In:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2">{dayjs(selectedBookingDetails.checkInTime).format('DD MMM YYYY, HH:mm')}</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Checked In By:</Typography></Grid>
                                <Grid item xs={6}><Typography variant="body2">{selectedBookingDetails.checkedInBy?.name || 'N/A'}</Typography></Grid>
                                </>
                            )}
                            {selectedBookingDetails.paymentId && <><Grid item xs={6}><Typography variant="body2" color="text.secondary">Payment ID:</Typography></Grid>
                            <Grid item xs={6}><Typography variant="body2" sx={{wordBreak: 'break-all'}}>{selectedBookingDetails.paymentId}</Typography></Grid></>}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            
            {/* Cancel Confirmation Modal */}
            <Dialog open={cancelConfirmOpen} onClose={() => setCancelConfirmOpen(false)}>
                <DialogTitle>Confirm Cancellation</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to cancel booking Ref ID: {bookingToCancel?.bookingRefId || bookingToCancel?._id.slice(-6)}?
                        This action may not be reversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelConfirmOpen(false)}>Back</Button>
                    <Button onClick={handleConfirmCancel} color="error" variant="contained">Confirm Cancel</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default BookingManagement;