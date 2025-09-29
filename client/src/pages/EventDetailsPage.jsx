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
    const [showtimes, setShowtimes] = useState([]);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [error, setError] = useState(null);
    const [showtimesError, setShowtimesError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs()); // Default to today

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
                    if (eventData?._id) { setEvent(eventData); }
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
        const fetchShowtimes = async () => {
            const formattedDate = formatDate(selectedDate);
            console.log(`[EventDetailsPage] Fetching showtimes for event: ${event?._id}, date: ${formattedDate}`);
            setLoadingShowtimes(true); setShowtimesError(null); setShowtimes([]);
            try {
                // Use eventId in the params
                const params = { eventId: eventId, date: formattedDate, sort: 'startTime_asc' };
                const response = await getShowtimesApi(params);
                console.log('[EventDetailsPage] Showtimes API response:', response);
                if (isMounted) setShowtimes(response?.data || []);
            } catch (err) {
                 console.error("[EventDetailsPage] Showtime fetch error:", err);
                 if (isMounted) { setShowtimesError(err.message || 'Failed to load sessions.'); setShowtimes([]); }
            } finally {
                if (isMounted) setLoadingShowtimes(false);
            }
        };
        // Only run if event loading is done AND event data exists
        if (!loadingEvent && event && eventId) {
            fetchShowtimes();
        } else {
             if (isMounted) setLoadingShowtimes(false);
        }
        return () => { isMounted = false; };
    }, [eventId, selectedDate, event, loadingEvent]);

    // Render loading/error/not found states
    if (loadingEvent) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error) return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    if (!event) return <Container sx={{ py: 4 }}><Alert severity="warning">Event details not found.</Alert></Container>;

    // Group showtimes (same logic as movie details)
    const showtimesByVenue = Array.isArray(showtimes) ? showtimes.reduce((acc, showtime) => {
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
                    <Grid xs={12} md={5}>
                        <Box component="img" sx={{ width: '100%', maxHeight: 450, objectFit: 'cover', borderRadius: 2, boxShadow: 3, bgcolor: 'grey.200' }}
                            alt={`${event.title} poster`}
                            src={event.imageUrl || "https://placehold.co/600x400/cccccc/ffffff?text=Event+Image"}
                            onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/cccccc/ffffff?text=Event+Image"; }} />
                    </Grid>
                    {/* Details Column */}
                    <Grid xs={12} md={7}>
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
                           Tickets / Sessions for {selectedDate.format('ddd, DD MMM YYYY')}
                        </Typography>
                        {/* TODO: Add Date Picker if event spans multiple days */}
                    </Box>
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
                                            <Typography variant='caption' sx={{ml: 0.5}}> (Rs. {show.price})</Typography>
                                            {show.screenName && <Typography variant='caption' sx={{ml: 0.5}}> ({show.screenName})</Typography>}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                         ))
                     ) : ( <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No specific sessions found for this date. Check event details for general booking info.</Typography> )}
                 </Box>

            </Paper>
        </Container>
    );
};

export default EventDetailsPage;
