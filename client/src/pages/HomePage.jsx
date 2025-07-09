// client/src/pages/HomePage.jsx (with Horizontal Scroll Arrows and Adjusted Movie Card Width)
import React, { useState, useEffect, useRef } from 'react';
import { getMoviesApi } from '../api/movies';
import { getEventsApi } from '../api/events';
import MovieCardMui from '../components/MovieCardMui';
import EventCardMui from '../components/EventCardMui';
// MUI Components
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid'; // Keep Grid for main page layout, but not for card wrapping
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton'; // Import IconButton
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'; // Import Left Arrow Icon
import ChevronRightIcon from '@mui/icons-material/ChevronRight'; // Import Right Arrow Icon

const HomePage = () => {
  const [nowShowingMovies, setNowShowingMovies] = useState([]);
  const [comingSoonMovies, setComingSoonMovies] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingComingSoon, setLoadingComingSoon] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorMovies, setErrorMovies] = useState(null);
  const [errorComingSoon, setErrorComingSoon] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);

  // Refs for each scrollable section
  const nowShowingScrollRef = useRef(null);
  const comingSoonScrollRef = useRef(null);
  const upcomingEventsScrollRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Now Showing Movies
      setLoadingMovies(true);
      setErrorMovies(null);
      try {
        const movieResponse = await getMoviesApi({ status: 'now_showing' });
        setNowShowingMovies(movieResponse.data || []);
      } catch (error) {
        setErrorMovies(error.message || 'Failed to load movies.');
      } finally {
        setLoadingMovies(false);
      }

      // Fetch Coming Soon Movies
      setLoadingComingSoon(true);
      setErrorComingSoon(null);
      try {
        const comingSoonResponse = await getMoviesApi({ status: 'coming_soon', sort: 'releaseDate_asc' });
        setComingSoonMovies(comingSoonResponse.data || []);
      } catch (error) {
        setErrorComingSoon(error.message || 'Failed to load upcoming movies.');
      } finally {
        setLoadingComingSoon(false);
      }

      // Fetch Upcoming Events
      setLoadingEvents(true);
      setErrorEvents(null);
      try {
        const eventResponse = await getEventsApi({ status: 'upcoming', sort: 'startDate_asc' });
        setUpcomingEvents(eventResponse.data || []);
      } catch (error) {
        setErrorEvents(error.message || 'Failed to load events.');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchData();
  }, []);

  // Scroll function to handle horizontal movement
  const handleScroll = (scrollContainer, direction) => {
    if (scrollContainer) {
      const scrollAmount = scrollContainer.clientWidth * 0.7; // Scroll by 70% of visible width
      scrollContainer.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Modified renderSection to use a horizontally scrolling Box, accept a ref, and sectionType
  const renderSection = (title, items, CardComponent, isLoading, error, scrollRef, sectionType) => (
    <Box component="section" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderLeft: '4px solid', borderColor: 'error.main', pl: 1.5 }}>
            {title}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        
        {/* Horizontal scrolling container */}
        <Box
            ref={scrollRef} // Assign the ref here
            sx={{
                display: 'flex',
                flexDirection: 'row', // Arrange items in a row
                flexWrap: 'nowrap',   // Prevent items from wrapping to next line
                overflowX: 'auto',    // Enable horizontal scrolling
                gap: 2,               // Space between cards
                py: 1,                // Padding top/bottom for scrollbar appearance
                scrollSnapType: 'x mandatory', // Optional: for snapping to cards
                '&::-webkit-scrollbar': { // Styling for scrollbar (for WebKit browsers)
                    height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,.2)',
                    borderRadius: '10px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,.1)',
                },
            }}
        >
            {isLoading ? (
                // Display 4 skeletons while loading, as a placeholder
                Array.from(new Array(4)).map((_, index) => (
                    // Adjusted minWidth based on sectionType
                    <Box 
                        key={`skeleton-${title}-${index}`} 
                        sx={{ 
                            minWidth: sectionType === 'movie' ? { xs: 150, sm: 170, md: 190, lg: 200 } : { xs: 200, sm: 220, md: 240, lg: 250 }, 
                            scrollSnapAlign: 'start' 
                        }}
                    >
                        <CardComponent isLoading={true} />
                    </Box>
                ))
            ) : items.length > 0 ? (
                items.map((item) => (
                    // Adjusted minWidth based on sectionType
                    <Box 
                        key={item._id} 
                        sx={{ 
                            minWidth: sectionType === 'movie' ? { xs: 150, sm: 170, md: 190, lg: 200 } : { xs: 200, sm: 220, md: 240, lg: 250 }, 
                            scrollSnapAlign: 'start' 
                        }}
                    >
                         <CardComponent movie={item} event={item} isLoading={false} />
                    </Box>
                ))
            ) : (
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3, width: '100%' }}>No {title.toLowerCase()} found.</Typography>
            )}
        </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
       {/* Now Showing Section with Arrows */}
       <Box sx={{ position: 'relative', width: '100%' }}>
            {nowShowingMovies.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(nowShowingScrollRef.current, 'left')}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' } // Hide on small screens for better responsiveness
                    }}
                    aria-label="scroll left"
                >
                    <ChevronLeftIcon />
                </IconButton>
            )}
            {renderSection("Now Showing", nowShowingMovies, MovieCardMui, loadingMovies, errorMovies, nowShowingScrollRef, 'movie')} {/* Added sectionType 'movie' */}
            {nowShowingMovies.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(nowShowingScrollRef.current, 'right')}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' }
                    }}
                    aria-label="scroll right"
                >
                    <ChevronRightIcon />
                </IconButton>
            )}
       </Box>

       {/* Coming Soon Movies Section with Arrows */}
       <Box sx={{ position: 'relative', width: '100%' }}>
            {comingSoonMovies.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(comingSoonScrollRef.current, 'left')}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' }
                    }}
                    aria-label="scroll left"
                >
                    <ChevronLeftIcon />
                </IconButton>
            )}
            {renderSection("Coming Soon Movies", comingSoonMovies, MovieCardMui, loadingComingSoon, errorComingSoon, comingSoonScrollRef, 'movie')} {/* Added sectionType 'movie' */}
            {comingSoonMovies.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(comingSoonScrollRef.current, 'right')}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' }
                    }}
                    aria-label="scroll right"
                >
                    <ChevronRightIcon />
                </IconButton>
            )}
       </Box>

       {/* Upcoming Events Section with Arrows */}
       <Box sx={{ position: 'relative', width: '100%' }}>
            {upcomingEvents.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(upcomingEventsScrollRef.current, 'left')}
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' }
                    }}
                    aria-label="scroll left"
                >
                    <ChevronLeftIcon />
                </IconButton>
            )}
            {renderSection("Upcoming Events", upcomingEvents, EventCardMui, loadingEvents, errorEvents, upcomingEventsScrollRef, 'event')} {/* Added sectionType 'event' */}
            {upcomingEvents.length > 0 && ( // Only show arrows if there's content to scroll
                <IconButton
                    onClick={() => handleScroll(upcomingEventsScrollRef.current, 'right')}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translate(50%, -50%)',
                        zIndex: 1,
                        bgcolor: 'background.paper',
                        boxShadow: 3,
                        '&:hover': { bgcolor: 'background.default' },
                        display: { xs: 'none', md: 'flex' }
                    }}
                    aria-label="scroll right"
                >
                    <ChevronRightIcon />
                </IconButton>
            )}
       </Box>
    </Container>
  );
};

export default HomePage;