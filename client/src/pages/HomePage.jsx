// client/src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getMoviesApi } from '../api/movies';
import { getEventsApi } from '../api/events';
import MovieCardMui from '../components/MovieCardMui';
import EventCardMui from '../components/EventCardMui';
// MUI Components
import { Container, Typography, Grid, Box, Alert, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const HomePage = () => {
    const [nowShowingMovies, setNowShowingMovies] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [errorMovies, setErrorMovies] = useState(null);
    const [errorEvents, setErrorEvents] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingMovies(true);
            setErrorMovies(null);
            try {
                const movieResponse = await getMoviesApi({ status: 'now_showing', limit: 20 });
                setNowShowingMovies(movieResponse.data || []);
            } catch (error) {
                setErrorMovies(error.message || 'Failed to load movies.');
            } finally {
                setLoadingMovies(false);
            }

            setLoadingEvents(true);
            setErrorEvents(null);
            try {
                const eventResponse = await getEventsApi({ status: 'upcoming', limit: 8 });
                setUpcomingEvents(eventResponse.data || []);
            } catch (error) {
                setErrorEvents(error.message || 'Failed to load events.');
            } finally {
                setLoadingEvents(false);
            }
        };

        fetchData();
    }, []);

    const HorizontalScrollSection = ({ title, items, CardComponent, itemType, isLoading, error }) => {
        const scrollRef = useRef(null);
        const [showLeftArrow, setShowLeftArrow] = useState(false);
        const [showRightArrow, setShowRightArrow] = useState(true);

        const handleScroll = () => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                setShowLeftArrow(scrollLeft > 10);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
            }
        };

        useEffect(() => {
            const scrollElement = scrollRef.current;
            const timer = setTimeout(() => {
                if (scrollElement) {
                    handleScroll();
                    scrollElement.addEventListener('scroll', handleScroll);
                }
            }, 100);
            return () => {
                if (scrollElement) {
                    scrollElement.removeEventListener('scroll', handleScroll);
                }
                clearTimeout(timer);
            };
        }, [items, isLoading]);

        const scroll = (direction) => {
            if (scrollRef.current) {
                const scrollAmount = scrollRef.current.clientWidth * 0.8;
                scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
            }
        };
        
        return (
            <Box component="section" sx={{ mb: 6 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', borderLeft: '4px solid', borderColor: 'error.main', pl: 1.5 }}>
                    {title}
                </Typography>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                
                <Box sx={{ position: 'relative', mt: 2 }}>
                    {showLeftArrow && !isLoading && (
                        <IconButton onClick={() => scroll('left')} sx={{ position: 'absolute', top: '40%', left: {xs: -10, sm: -20}, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, border: '1px solid #ddd' }}>
                            <ArrowBackIosNewIcon />
                        </IconButton>
                    )}
                    <Box
                        ref={scrollRef}
                        sx={{
                            display: 'flex',
                            overflowX: 'scroll',
                            scrollSnapType: 'x mandatory',
                            gap: {xs: 2, sm: 3},
                            pb: 2,
                            '&::-webkit-scrollbar': { display: 'none' },
                            scrollbarWidth: 'none',
                        }}
                    >
                        {(isLoading ? Array.from(new Array(6)) : items).map((item, index) => (
                             <Box key={isLoading ? `skeleton-${index}` : item._id} sx={{ flex: '0 0 auto', width: {xs: '180px', sm: '220px'}, scrollSnapAlign: 'start', height: 'auto' }}>
                                <CardComponent 
                                    movie={itemType === 'movie' ? item : undefined}
                                    event={itemType === 'event' ? item : undefined}
                                    isLoading={isLoading} 
                                />
                            </Box>
                        ))}
                    </Box>
                     {showRightArrow && !isLoading && (
                        <IconButton onClick={() => scroll('right')} sx={{ position: 'absolute', top: '40%', right: {xs: -10, sm: -20}, transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, border: '1px solid #ddd' }}>
                            <ArrowForwardIosIcon />
                        </IconButton>
                    )}
                </Box>
                {!isLoading && items.length === 0 && !error && (
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
                        No {title.toLowerCase()} available at the moment.
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <HorizontalScrollSection title="Now Showing" items={nowShowingMovies} CardComponent={MovieCardMui} itemType="movie" isLoading={loadingMovies} error={errorMovies} />
            <HorizontalScrollSection title="Upcoming Events" items={upcomingEvents} CardComponent={EventCardMui} itemType="event" isLoading={loadingEvents} error={errorEvents} />
        </Container>
    );
};

export default HomePage;