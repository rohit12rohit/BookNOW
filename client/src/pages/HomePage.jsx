// client/src/pages/HomePage.jsx (Corrected Logic)
import React, { useState, useEffect } from 'react';
import { getMoviesApi } from '../api/movies';
import { getEventsApi } from '../api/events';
import MovieCardMui from '../components/MovieCardMui';
import EventCardMui from '../components/EventCardMui';
// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
// Note: Skeletons are now handled *inside* the card components

const HomePage = () => {
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorMovies, setErrorMovies] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Movies
      setLoadingMovies(true);
      setErrorMovies(null);
      try {
        const movieResponse = await getMoviesApi({ status: 'now_showing', limit: 4 });
        setNowShowingMovies(movieResponse.data || []);
      } catch (error) {
        setErrorMovies(error.message || 'Failed to load movies.');
      } finally {
        setLoadingMovies(false);
      }

      // Fetch Events
      setLoadingEvents(true);
      setErrorEvents(null);
      try {
        const eventResponse = await getEventsApi({ status: 'upcoming', limit: 4 });
        setUpcomingEvents(eventResponse.data || []);
      } catch (error) {
        setErrorEvents(error.message || 'Failed to load events.');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchData();
  }, []);


  // Updated renderSection to handle loading state by passing isLoading to CardComponent
  const renderSection = (title, items, CardComponent, isLoading, error) => (
    <Box component="section" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderLeft: '4px solid', borderColor: 'error.main', pl: 1.5 }}>
            {title}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Grid container spacing={3}> {/* Keep container */}
            {isLoading ? (
                Array.from(new Array(4)).map((_, index) => (
                    // Apply breakpoint props directly to Grid
                    <Grid xs={12} sm={6} md={4} lg={3} key={`skeleton-${title}-${index}`}>
                        <CardComponent isLoading={true} />
                    </Grid>
                ))
            ) : items.length > 0 ? (
                items.map((item) => (
                     // Apply breakpoint props directly to Grid
                    <Grid xs={12} sm={6} md={4} lg={3} key={item._id}>
                         <CardComponent movie={item} event={item} isLoading={false} />
                    </Grid>
                ))
            ) : (
                 // Apply breakpoint props directly to Grid here too if needed, though xs={12} covers it
                !error && <Grid xs={12}><Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No {title.toLowerCase()} found.</Typography></Grid>
            )}
        </Grid>
    </Box>
);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
       {renderSection("Now Showing", nowShowingMovies, MovieCardMui, loadingMovies, errorMovies)}
       {renderSection("Upcoming Events", upcomingEvents, EventCardMui, loadingEvents, errorEvents)}
    </Container>
  );
};

export default HomePage;