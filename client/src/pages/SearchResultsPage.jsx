// client/src/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { globalSearchApi } from '../api/search';
import MovieCardMui from '../components/MovieCardMui';
import EventCardMui from '../components/EventCardMui'; // Assuming you have this
// You might need a VenueCardMui as well, or display venue info differently
import { Container, Typography, Box, Grid, CircularProgress, Alert, Paper, Divider, Link as MuiLink } from '@mui/material';

// Simple Venue display component for search results
const VenueSearchResultCard = ({ venue }) => (
    <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="h6" gutterBottom>{venue.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {venue.address?.street}, {venue.address?.city}, {venue.address?.state}
                </Typography>
                {venue.facilities && venue.facilities.length > 0 && (
                    <Typography variant="caption" display="block" sx={{mt:1}}>
                        Facilities: {venue.facilities.join(', ')}
                    </Typography>
                )}
            </Box>
            {/* Link to a future venue detail page if you create one */}
            {/* <MuiLink component={RouterLink} to={`/venues/${venue._id}`} sx={{mt:1, alignSelf:'flex-start'}}>View Details</MuiLink> */}
        </Paper>
    </Grid>
);


const SearchResultsPage = () => {
    const location = useLocation();
    const [searchParams] = useState(new URLSearchParams(location.search));
    const query = searchParams.get('q');

    const [results, setResults] = useState({ movies: [], events: [], venues: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (query) {
            setIsLoading(true);
            setError(null);
            globalSearchApi(query)
                .then(data => {
                    setResults({
                        movies: data.results?.movies || [],
                        events: data.results?.events || [],
                        venues: data.results?.venues || [],
                    });
                })
                .catch(err => {
                    setError(err.message || 'Failed to fetch search results.');
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
            setError('No search query provided.');
        }
    }, [query]);

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }
    if (error) {
        return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    const { movies, events, venues } = results;
    const totalResults = movies.length + events.length + venues.length;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Search Results for "{query}"
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Found {totalResults} result(s).
            </Typography>

            {totalResults === 0 && !isLoading && (
                <Typography sx={{ textAlign: 'center', mt: 3 }}>No results found matching your query.</Typography>
            )}

            {movies.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb:1, mb:2}}>Movies ({movies.length})</Typography>
                    <Grid container spacing={3}>
                        {movies.map(movie => (
                            // MovieCardMui expects 'movie' prop and 'isLoading' (which is false here)
                            <Grid item xs={12} sm={6} md={4} lg={3} key={`movie-${movie._id}`}>
                                <MovieCardMui movie={movie} isLoading={false} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {events.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb:1, mb:2}}>Events ({events.length})</Typography>
                    <Grid container spacing={3}>
                        {events.map(event => (
                             // EventCardMui expects 'event' prop and 'isLoading'
                            <Grid item xs={12} sm={6} md={4} lg={3} key={`event-${event._id}`}>
                                <EventCardMui event={event} isLoading={false} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {venues.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom sx={{borderBottom: 1, borderColor: 'divider', pb:1, mb:2}}>Venues ({venues.length})</Typography>
                    <Grid container spacing={3}>
                        {venues.map(venue => (
                            <VenueSearchResultCard key={`venue-${venue._id}`} venue={venue} />
                        ))}
                    </Grid>
                </Box>
            )}
        </Container>
    );
};

export default SearchResultsPage;