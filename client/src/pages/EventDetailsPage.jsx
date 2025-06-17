// client/src/pages/EventDetailsPage.jsx
// Displays details for a specific event.
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
// API Calls
import { getEventByIdApi } from '../api/events';
import { getShowtimesApi } from '../api/showtimes'; // Use same showtime API
// MUI Components
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // Added DatePicker
// Icons
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import LanguageIcon from '@mui/icons-material/Language';
import dayjs from 'dayjs';

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');

const EventDetailsPage = () => {
    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [allEventShowtimes, setAllEventShowtimes] = useState([]); // Store all upcoming showtimes
    const [displayedShowtimes, setDisplayedShowtimes] = useState([]); // Showtimes filtered by selectedDate
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [error, setError] = useState(null);
    const [showtimesError, setShowtimesError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null); // Initially no specific date selected for showtimes

    // Fetch Event Details
    useEffect(() => {
        let isMounted = true;
        const fetchEvent = async () => {
            if (!eventId) { if(isMounted){ setError('Event ID missing.'); setLoadingEvent(false); setEvent(null); } return; }
            console.log(`[EventDetailsPage] Fetching event: ${eventId}`);
            if(isMounted){ setLoadingEvent(true); setError(null); setEvent(null); }
            try {
                const eventData = await getEventByIdApi(eventId);
                console.log('[EventDetailsPage] Event API response:', eventData);
                if (isMounted) {
                    if (eventData?._id) {
                        setEvent(eventData);
                        // Set default selected date to event start date or today
                        const initialDate = eventData.startDate ? dayjs(eventData.startDate) : dayjs();
                        setSelectedDate(initialDate); // Set initial date for date picker
                    }
                    else { setError('Event not found or invalid data.'); setEvent(null); }
                }
            } catch (err) {
                console.error("[EventDetailsPage] Error fetching event:", err);
                if (isMounted) { setError(err?.response?.data?.msg || err.message || 'Failed to load event.'); setEvent(null); }
            } finally {
                if (isMounted) setLoadingEvent(false);
            }
        };
        fetchEvent();
        return () => { isMounted = false; };
    }, [eventId]);

    // Fetch Showtimes for this Event
    useEffect(() => {
        let isMounted = true;
        const fetchEventShowtimes = async () => {
            // Fetch ALL upcoming showtimes for the event, regardless of specific date
            console.log(`[EventDetailsPage] Fetching ALL upcoming showtimes for event: ${event?._id}`);
            setLoadingShowtimes(true); setShowtimesError(null); setAllEventShowtimes([]);
            try {
                const params = { eventId: eventId, sort: 'startTime_asc' }; // No 'date' filter here
                const response = await getShowtimesApi(params);
                console.log('[EventDetailsPage] All Showtimes API response:', response);
                if (isMounted) setAllEventShowtimes(response?.data || []);
            } catch (err) {
                 console.error("[EventDetailsPage] All Showtime fetch error:", err);
                 if (isMounted) { setShowtimesError(err.message || 'Failed to load sessions.'); setAllEventShowtimes([]); }
            } finally {
                if (isMounted) setLoadingShowtimes(false);
            }
        };
        // Only run if event loading is done AND event data exists
        if (!loadingEvent && event && eventId) {
            fetchEventShowtimes();
        } else {
             if (isMounted) setLoadingShowtimes(false);
        }
        return () => { isMounted = false; };
    }, [eventId, event, loadingEvent]);

    // Filter showtimes by selectedDate whenever selectedDate or allEventShowtimes changes
    useEffect(() => {
        if (selectedDate && Array.isArray(allEventShowtimes)) {
            const startOfDay = selectedDate.startOf('day');
            const endOfDay = selectedDate.endOf('day');

            const filtered = allEventShowtimes.filter(showtime =>
                dayjs(showtime.startTime).isBetween(startOfDay, endOfDay, null, '[]') // Inclusive start and end
            );
            setDisplayedShowtimes(filtered);
        } else {
            setDisplayedShowtimes([]); // Clear if no date selected or no showtimes
        }
    }, [selectedDate, allEventShowtimes]);


    // Render loading/error/not found states
    if (loadingEvent) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!event) return <Container sx={{ py: 4 }}><Alert severity="warning">Event details not found.</Alert></Container>;

    // Get unique dates for showtimes, sort them
    const uniqueDates = Array.from(new Set(
        allEventShowtimes.map(showtime => dayjs(showtime.startTime).format('YYYY-MM-DD'))
    )).sort(); // Sorts dates chronologically

    // Group displayed showtimes by venue
    const showtimesByVenue = Array.isArray(displayedShowtimes) ? displayedShowtimes.reduce((acc, showtime) => {
        const venueName = showtime.venue?.name || event.address?.city || 'Venue N/A'; // Use event city if no venue linked
        if (!acc[venueName]) { acc[venueName] = { venue: showtime.venue || event.address, times: [] }; } // Store venue or address
        acc[venueName].times.push(showtime);
        return acc;
    }, {}) : {};

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                    {/* Image Column */}
                    <Grid item xs={12} md={5}>
                        <Box component="img" sx={{ width: '100%', maxHeight: 450, objectFit: 'cover', borderRadius: 2, boxShadow: 3, bgcolor: 'grey.200' }}
                            alt={`${event.title} poster`}
                            src={event.imageUrl || "https://placehold.co/600x400/cccccc/ffffff?text=Event+Image"}
                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/cccccc/ffffff?text=Event+Image"; }} />
                    </Grid>
                    {/* Details Column */}
                    <Grid item xs={12} md={7}>
                        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {event.title}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip icon={<CategoryIcon />} label={event.category || 'N/A'} size="small" variant="filled" color="primary" />
                            {event.eventLanguage && <Chip icon={<LanguageIcon />} label={event.eventLanguage} size="small" variant="outlined" />}
                            {event.startDate && <Chip icon={<CalendarMonthIcon />} label={`Starts: ${dayjs(event.startDate).format('ddd, DD MMM YYYY, h:mm A')}`} size="small" variant="outlined" />}
                            {event.endDate && <Chip icon={<CalendarMonthIcon />} label={`Ends: ${dayjs(event.endDate).format('ddd, DD MMM YYYY, h:mm A')}`} size="small" variant="outlined" />}
                        </Box>
                         <Box sx={{ mb: 2 }}>
                             {Array.isArray(event.tags) && event.tags.map((tag) => (
                                 <Chip key={tag} icon={<TagIcon fontSize='small'/>} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                             ))}
                         </Box>
                         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                {event.venue?.name ? `${event.venue.name}, ` : ''}
                                {event.address?.street ? `${event.address.street}, ` : ''}
                                {event.address?.city || 'City N/A'}, {event.address?.state || 'State N/A'}
                            </Typography>
                         </Box>
                         <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                            {event.description || 'No description available.'}
                        </Typography>
                         {event.organizerInfo?.name && (
                             <Typography variant="body2" color="text.secondary">
                                 Organized by: {event.organizerInfo.name}
                                 {event.organizerInfo.contact && ` (${event.organizerInfo.contact})`}
                             </Typography>
                         )}
                    </Grid>
                </Grid>

                 <Divider sx={{ my: 4 }} />

                 {/* Showtimes Section (If event uses showtime booking) */}
                 <Box component="section" sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                           Tickets / Sessions
                        </Typography>
                        {/* Date Picker for event showtimes */}
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                            format="ddd, DD MMM YYYY"
                            // Consider minDate/maxDate if the event has a fixed duration
                            minDate={event.startDate ? dayjs(event.startDate) : undefined}
                            maxDate={event.endDate ? dayjs(event.endDate) : undefined}
                        />
                    </Box>
                    {uniqueDates.length > 0 && (
                        <Box sx={{ display: 'flex', overflowX: 'auto', gap: 1, pb: 1, mb: 2 }}>
                            {uniqueDates.map(dateStr => (
                                <Chip
                                    key={dateStr}
                                    label={dayjs(dateStr).format('ddd, MMM DD')}
                                    onClick={() => setSelectedDate(dayjs(dateStr))}
                                    color={selectedDate && dayjs(selectedDate).isSame(dateStr, 'day') ? 'primary' : 'default'}
                                    variant={selectedDate && dayjs(selectedDate).isSame(dateStr, 'day') ? 'contained' : 'outlined'}
                                    clickable
                                />
                            ))}
                        </Box>
                    )}

                     {showtimesError && <Alert severity="warning" sx={{my: 2}}>{showtimesError}</Alert>}
                     {loadingShowtimes ? ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box> )
                     : Object.keys(showtimesByVenue).length > 0 ? (
                         Object.entries(showtimesByVenue).map(([venueName, data]) => (
                            <Box key={venueName} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="h6" component="h3" gutterBottom>{venueName}</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {data.times.map(show => (
                                        <Button key={show._id} variant="outlined" color="error" component={RouterLink} to={`/book/${show._id}`} >
                                            {dayjs(show.startTime).format('h:mm A')} {/* Only time if date is selected */}
                                            {/* Note: show.price is removed from the Showtime model and replaced by priceTiers.
                                                You might want to display a price range here or a "Starts from" price.
                                                For now, removed the direct show.price display. */}
                                            {show.priceTiers && show.priceTiers.length > 0 && (
                                                <Typography variant='caption' sx={{ml: 0.5}}> (From Rs. {Math.min(...show.priceTiers.map(pt => pt.price)).toFixed(2)})</Typography>
                                            )}
                                            {show.screenName && <Typography variant='caption' sx={{ml: 0.5}}> ({show.screenName})</Typography>}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                         ))
                     ) : ( <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No specific sessions found for {selectedDate ? selectedDate.format('DD MMM YYYY') : 'selected date'}. Check event details for general booking info.</Typography> )}
                 </Box>

            </Paper>
        </Container>
    );
};

export default EventDetailsPage;