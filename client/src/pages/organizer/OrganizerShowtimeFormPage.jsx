// client/src/pages/organizer/OrganizerShowtimeFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getMyVenuesApi, getMyEventsApi } from '../../api/organizer';
import { getMoviesApi } from '../../api/movies';
import { createShowtimeApi, getShowtimeByIdApi, updateShowtimeApi } from '../../api/showtimes';
import {
    Container, Typography, Box, Paper, TextField, Button, Grid, CircularProgress, Alert,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Autocomplete, FormHelperText,
    ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import MovieIcon from '@mui/icons-material/Movie';
import EventIcon from '@mui/icons-material/Event';

const initialShowtimeState = {
    itemType: 'movie', // 'movie' or 'event'
    movie: null,
    event: null,
    venue: '',
    screenId: '',
    startTime: null,
    priceTiers: [],
    isActive: true,
};

const OrganizerShowtimeFormPage = ({ mode = 'create' }) => {
    const navigate = useNavigate();
    const { showtimeId } = useParams();
    const location = useLocation();

    const [showtimeData, setShowtimeData] = useState(initialShowtimeState);
    const [myVenues, setMyVenues] = useState([]);
    const [allMovies, setAllMovies] = useState([]);
    const [myEvents, setMyEvents] = useState([]); // State for organizer's events
    const [availableScreens, setAvailableScreens] = useState([]);
    const [uniqueSeatTypesInLayout, setUniqueSeatTypesInLayout] = useState([]);

    const [isLoadingForm, setIsLoadingForm] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [formError, setFormError] = useState(null);
    const pageTitle = mode === 'create' ? 'Add New Showtime' : 'Edit Showtime';

    // Fetch all necessary data for dropdowns
    const fetchDropdownDataAndExistingShowtime = useCallback(async () => {
        setIsLoadingInitialData(true);
        setFormError(null);
        try {
            const [venuesRes, moviesRes, eventsRes] = await Promise.all([
                getMyVenuesApi(),
                getMoviesApi({ limit: 1000, sort: 'title_asc' }),
                getMyEventsApi() // Fetch organizer's events
            ]);
            const fetchedVenues = venuesRes || [];
            const fetchedMovies = moviesRes.data || [];
            const fetchedEvents = eventsRes || [];
            setMyVenues(fetchedVenues);
            setAllMovies(fetchedMovies);
            setMyEvents(fetchedEvents);

            if (mode === 'edit' && showtimeId) {
                const existingShowtime = await getShowtimeByIdApi(showtimeId);
                const itemType = existingShowtime.event ? 'event' : 'movie';
                const selectedMovieObject = itemType === 'movie' ? fetchedMovies.find(m => m._id === existingShowtime.movie?._id) : null;
                const selectedEventObject = itemType === 'event' ? fetchedEvents.find(e => e._id === existingShowtime.event?._id) : null;
                
                setShowtimeData({
                    itemType: itemType,
                    movie: selectedMovieObject,
                    event: selectedEventObject,
                    venue: existingShowtime.venue?._id || '',
                    screenId: existingShowtime.screenId || '',
                    startTime: existingShowtime.startTime ? dayjs(existingShowtime.startTime) : null,
                    priceTiers: Array.isArray(existingShowtime.priceTiers) ? existingShowtime.priceTiers : [],
                    isActive: existingShowtime.isActive,
                });

                if (existingShowtime.venue?._id) {
                    const selectedVenueDetails = fetchedVenues.find(v => v._id === existingShowtime.venue._id);
                    setAvailableScreens(selectedVenueDetails?.screens || []);
                }
            } else {
                const queryParams = new URLSearchParams(location.search);
                const preSelectedVenueId = queryParams.get('venueId');
                setShowtimeData(prev => ({ ...prev, venue: preSelectedVenueId || '' }));
            }
        } catch (err) {
            setFormError(err.message || "Failed to load required data.");
        } finally {
            setIsLoadingInitialData(false);
        }
    }, [mode, showtimeId, location.search]);

    useEffect(() => {
        fetchDropdownDataAndExistingShowtime();
    }, [fetchDropdownDataAndExistingShowtime]);
    
    // Update screens when venue changes
    useEffect(() => {
        if (showtimeData.venue && myVenues.length > 0) {
            const selectedVenueDetails = myVenues.find(v => v._id === showtimeData.venue);
            setAvailableScreens(selectedVenueDetails?.screens || []);
        } else {
             setAvailableScreens([]);
        }
        // Reset screen and seat types if venue changes
        setShowtimeData(prev => ({...prev, screenId: '', priceTiers: []}));
        setUniqueSeatTypesInLayout([]);
    }, [showtimeData.venue, myVenues]);

    // Update seat types and price tiers when screen changes
    useEffect(() => {
        if (showtimeData.screenId && showtimeData.venue) {
            const venue = myVenues.find(v => v._id === showtimeData.venue);
            const screen = venue?.screens.find(s => s._id === showtimeData.screenId);
            if(screen?.seatLayout?.rows) {
                const types = new Set();
                screen.seatLayout.rows.forEach(row => row.seats.forEach(seat => types.add(seat.type || 'Normal')));
                const filteredTypes = Array.from(types).filter(type => type !== 'Unavailable');
                setUniqueSeatTypesInLayout(filteredTypes);
                 // Auto-populate priceTiers for new showtime
                if(mode === 'create') {
                     setShowtimeData(prev => ({...prev, priceTiers: filteredTypes.map(type => ({ seatType: type, price: ''}))}));
                }
            }
        }
    }, [showtimeData.screenId, showtimeData.venue, myVenues, mode]);

    const handleItemTypeChange = (event, newItemType) => {
        if (newItemType !== null) {
            setShowtimeData(prev => ({
                ...prev,
                itemType: newItemType,
                movie: null,
                event: null // Reset selections when type changes
            }));
        }
    };
    
    // ... (other handlers like handleFieldChange, handleDateTimeChange, handlePriceTierChange are okay)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoadingForm(true);
        setFormError(null);

        if ((showtimeData.itemType === 'movie' && !showtimeData.movie) || (showtimeData.itemType === 'event' && !showtimeData.event)) {
             setFormError("Please select a Movie or an Event."); setIsLoadingForm(false); return;
        }
        // ... (other validations)

        const payload = {
            movie: showtimeData.movie?._id,
            event: showtimeData.event?._id,
            venue: showtimeData.venue,
            screenId: showtimeData.screenId,
            startTime: showtimeData.startTime ? dayjs(showtimeData.startTime).toISOString() : null,
            priceTiers: showtimeData.priceTiers.filter(t => String(t.price).trim() !== ''),
            isActive: showtimeData.isActive,
        };

        try {
            if (mode === 'edit') {
                await updateShowtimeApi(showtimeId, payload);
            } else {
                await createShowtimeApi(payload);
            }
            navigate('/organizer?tab=showtimes');
        } catch (err) {
            const apiError = err.errors ? err.errors.map(er => er.msg).join(', ') : (err.msg || 'Operation failed.');
            setFormError(apiError);
        } finally {
            setIsLoadingForm(false);
        }
    };

    if (isLoadingInitialData) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }
    
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 } }}>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                    {pageTitle}
                </Typography>
                {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
                
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                        
                        {/* Item Type Toggle */}
                        <Grid item xs={12} sx={{textAlign: 'center'}}>
                            <ToggleButtonGroup
                                color="primary"
                                value={showtimeData.itemType}
                                exclusive
                                onChange={handleItemTypeChange}
                                aria-label="item type"
                            >
                                <ToggleButton value="movie" aria-label="movie"><MovieIcon sx={{mr: 1}}/> Movie</ToggleButton>
                                <ToggleButton value="event" aria-label="event"><EventIcon sx={{mr: 1}}/> Event</ToggleButton>
                            </ToggleButtonGroup>
                        </Grid>

                        {/* Conditional Autocomplete */}
                        <Grid item xs={12}>
                            {showtimeData.itemType === 'movie' ? (
                                <Autocomplete
                                    options={allMovies}
                                    getOptionLabel={(option) => option.title || ""}
                                    value={showtimeData.movie}
                                    onChange={(event, newValue) => setShowtimeData(prev => ({...prev, movie: newValue}))}
                                    isOptionEqualToValue={(option, value) => option._id === value?._id}
                                    renderInput={(params) => <TextField {...params} label="Select Movie *" variant="outlined" />}
                                />
                            ) : (
                                <Autocomplete
                                    options={myEvents}
                                    getOptionLabel={(option) => option.title || ""}
                                    value={showtimeData.event}
                                    onChange={(event, newValue) => setShowtimeData(prev => ({...prev, event: newValue}))}
                                    isOptionEqualToValue={(option, value) => option._id === value?._id}
                                    renderInput={(params) => <TextField {...params} label="Select Event *" variant="outlined" />}
                                />
                            )}
                        </Grid>
                        
                        {/* Venue and Screen Select */}
                        <Grid item xs={12} sm={6}>
                           <FormControl fullWidth required>
                               <InputLabel>Venue</InputLabel>
                               <Select name="venue" label="Venue" value={showtimeData.venue} onChange={(e) => setShowtimeData(prev => ({...prev, venue: e.target.value}))}>
                                   {myVenues.map(v => <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>)}
                               </Select>
                           </FormControl>
                        </Grid>
                         <Grid item xs={12} sm={6}>
                           <FormControl fullWidth required disabled={!showtimeData.venue}>
                               <InputLabel>Screen</InputLabel>
                               <Select name="screenId" label="Screen" value={showtimeData.screenId} onChange={(e) => setShowtimeData(prev => ({...prev, screenId: e.target.value}))}>
                                   {availableScreens.map(s => <MenuItem key={s._id} value={s._id}>{s.name} (Cap: {s.capacity})</MenuItem>)}
                               </Select>
                           </FormControl>
                        </Grid>

                        {/* DateTime Picker */}
                        <Grid item xs={12}>
                            <DateTimePicker
                                label="Start Date & Time *"
                                value={showtimeData.startTime}
                                onChange={(newValue) => setShowtimeData(prev => ({...prev, startTime: newValue}))}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                        </Grid>

                        {/* Price Tiers */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Pricing (per seat type)</Typography>
                            {uniqueSeatTypesInLayout.length > 0 ? uniqueSeatTypesInLayout.map((seatType, index) => {
                                const tier = showtimeData.priceTiers.find(pt => pt.seatType === seatType) || { price: '' };
                                return (
                                <TextField
                                    key={seatType}
                                    label={`Price for ${seatType} Seats`}
                                    type="number"
                                    value={tier.price}
                                    onChange={(e) => {
                                        const updatedTiers = [...showtimeData.priceTiers];
                                        const tierIndex = updatedTiers.findIndex(t => t.seatType === seatType);
                                        if(tierIndex > -1) {
                                            updatedTiers[tierIndex].price = e.target.value;
                                        } else {
                                            updatedTiers.push({ seatType: seatType, price: e.target.value });
                                        }
                                        setShowtimeData(prev => ({...prev, priceTiers: updatedTiers}));
                                    }}
                                    fullWidth required margin="dense" inputProps={{ min: 0, step: "10" }}
                                />
                                )
                            }) : <Alert severity="info">Select a screen to see pricing options based on its seat layout.</Alert>}
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={showtimeData.isActive} onChange={(e) => setShowtimeData(prev => ({...prev, isActive: e.target.checked}))} />} label="Showtime is Active" />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button variant="outlined" onClick={() => navigate('/organizer?tab=showtimes')}>Cancel</Button>
                            <Button type="submit" variant="contained" color="success" disabled={isLoadingForm}>
                                {isLoadingForm ? <CircularProgress size={24}/> : (mode === 'edit' ? 'Save Changes' : 'Create Showtime')}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
};

export default OrganizerShowtimeFormPage;