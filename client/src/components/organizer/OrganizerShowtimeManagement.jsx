// client/src/components/organizer/OrganizerShowtimeManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyShowtimesApi } from '../../api/organizer'; // Fetches showtimes for organizer's venues
import { getMyVenuesApi } from '../../api/organizer';    // To select a venue for filtering/adding showtimes
import { deleteShowtimeApi } from '../../api/showtimes'; // For deactivating/deleting
import {
    Box, Button, Typography, Paper, List, ListItem, ListItemText, IconButton,
    CircularProgress, Alert, Chip, Tooltip, Divider, Grid, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const OrganizerShowtimeManagement = () => {
    const navigate = useNavigate();
    const [showtimes, setShowtimes] = useState([]);
    const [myVenues, setMyVenues] = useState([]);
    const [selectedVenueFilter, setSelectedVenueFilter] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState(null); // dayjs object or null
    const [isLoading, setIsLoading] = useState(false); // Combined loading state
    const [error, setError] = useState(null);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const venuesData = await getMyVenuesApi();
            setMyVenues(Array.isArray(venuesData) ? venuesData : []);
            // Fetch all showtimes initially or based on a default filter
            await fetchShowtimes(null, null); // Fetch all initially
        } catch (err) {
            setError(err.message || "Failed to load initial data.");
        } finally {
            setIsLoading(false);
        }
    }, []); // Removed fetchShowtimes from dep array, it's defined below

    const fetchShowtimes = useCallback(async (venueId, date) => {
        setIsLoading(true); // Show loading for showtime fetch specifically
        setError(null);
        try {
            const params = {};
            if (venueId) params.venueId = venueId;
            if (date) params.date = dayjs(date).format('YYYY-MM-DD');
            // Add other params like movieId if you add a movie filter

            const showtimesData = await getMyShowtimesApi(params);
            setShowtimes(Array.isArray(showtimesData) ? showtimesData : []);
        } catch (err) {
            setError(err.message || 'Failed to load showtimes.');
            setShowtimes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleFilterApply = () => {
        fetchShowtimes(selectedVenueFilter, selectedDateFilter);
    };
    
    const handleClearFilters = () => {
        setSelectedVenueFilter('');
        setSelectedDateFilter(null);
        fetchShowtimes(null, null); // Fetch all
    };

    const handleAddNewShowtime = () => {
        // Navigate to a dedicated form page for creating showtimes.
        // Might need to pass selectedVenueFilter if a venue is already chosen as context.
        navigate(`/organizer/showtimes/new${selectedVenueFilter ? `?venueId=${selectedVenueFilter}` : ''}`);
    };

    const handleEditShowtime = (showtimeId) => {
        navigate(`/organizer/showtimes/edit/${showtimeId}`);
    };

    const handleDeleteShowtime = async (showtimeId) => {
        if (window.confirm('Are you sure you want to delete/deactivate this showtime? This might affect existing bookings if not handled carefully.')) {
            try {
                await deleteShowtimeApi(showtimeId);
                // Refresh current view
                fetchShowtimes(selectedVenueFilter, selectedDateFilter);
            } catch (err) {
                alert(`Failed to delete showtime: ${err.message || 'Server error'}`);
            }
        }
    };

    const getStatusChipColor = (isActive) => isActive ? "success" : "default";


    return (
        <Box>
            <Typography variant="h6" gutterBottom>My Showtimes</Typography>
            
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Filter by Venue</InputLabel>
                            <Select
                                value={selectedVenueFilter}
                                label="Filter by Venue"
                                onChange={(e) => setSelectedVenueFilter(e.target.value)}
                            >
                                <MenuItem value=""><em>All My Venues</em></MenuItem>
                                {myVenues.map(venue => (
                                    <MenuItem key={venue._id} value={venue._id}>{venue.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <DatePicker 
                            label="Filter by Date"
                            value={selectedDateFilter}
                            onChange={(newValue) => setSelectedDateFilter(newValue)}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button onClick={handleFilterApply} variant="contained" size="medium">Apply</Button>
                        <Button onClick={handleClearFilters} variant="outlined" size="medium">Clear</Button>
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={handleAddNewShowtime}
                >
                    Add New Showtime
                </Button>
            </Box>

            {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>}
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

            {!isLoading && showtimes.length === 0 && (
                <Paper elevation={1} sx={{p:3, textAlign: 'center'}}>
                    <Typography color="text.secondary">No showtimes found matching your criteria.</Typography>
                </Paper>
            )}
            
            {!isLoading && showtimes.length > 0 && (
                <Paper elevation={0} variant="outlined">
                    <List disablePadding>
                        {showtimes.map((showtime, index) => (
                            <React.Fragment key={showtime._id}>
                                <ListItem
                                    sx={{flexWrap: 'wrap'}}
                                    secondaryAction={
                                        <Box sx={{display: 'flex', gap: 0.5, mt: {xs:1, sm:0}}}>
                                            <Tooltip title="Edit Showtime">
                                                <IconButton size="small" onClick={() => handleEditShowtime(showtime._id)}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete/Deactivate Showtime">
                                                <IconButton size="small" onClick={() => handleDeleteShowtime(showtime._id)}>
                                                    <DeleteIcon color="error"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={<Typography variant="subtitle1" sx={{fontWeight: 'medium'}}>{showtime.movie?.title || showtime.event?.title || 'Item N/A'}</Typography>}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    Venue: {showtime.venue?.name} - Screen: {showtime.screenName}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Time: {dayjs(showtime.startTime).format('DD MMM YY, hh:mm A')} - {dayjs(showtime.endTime).format('hh:mm A')}
                                                </Typography>
                                                <Typography variant="caption" display="block">
                                                    Price: Rs. {showtime.price?.toFixed(2)} | Seats: {showtime.bookedSeats?.length || 0}/{showtime.totalSeats}
                                                </Typography>
                                                Status: <Chip label={showtime.isActive ? "Active" : "Inactive"} size="small" variant="outlined" color={getStatusChipColor(showtime.isActive)}/>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < showtimes.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default OrganizerShowtimeManagement;