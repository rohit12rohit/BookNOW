// client/src/pages/MovieDetailsPage.jsx (with Corrected YouTube Embed URL)
import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
// API Calls
import { getMovieByIdApi } from '../api/movies';
import { getShowtimesApi } from '../api/showtimes';
import { getReviewsForMovieApi } from '../api/reviews';
// MUI Components
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Button from '@mui/material/Button';
// MUI Date Picker & Adapter
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanguageIcon from '@mui/icons-material/Language';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';

// Helper to format date string to YYYY-MM-DD using dayjs
const formatDate = (date) => {
    return dayjs(date).format('YYYY-MM-DD');
};

const MovieDetailsPage = () => {
    const { movieId } = useParams();

    // State variables
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loadingMovie, setLoadingMovie] = useState(true);
    const [loadingShowtimes, setLoadingShowtimes] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [error, setError] = useState(null);
    const [reviewsError, setReviewsError] = useState(null);
    const [showtimesError, setShowtimesError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    // Function to extract YouTube video ID from various URLs
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        // Updated regex to better capture standard YouTube watch and short URLs
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|\(embed\)\/|v\/|watch\?v=|\.(?:youtube|youtu)\.com\/embed\/|\/(?:channel|user)\/[^\/]+\/videos\/|)([^#\&\?]*))|(?:youtu\.be\/([^#\&\?]*))/.exec(url);
        return (regExp && regExp[1] && regExp[1].length === 11) ? regExp[1] : (regExp && regExp[2] && regExp[2].length === 11) ? regExp[2] : null;
    };

    // --- Effect 1: Fetch Movie Details ---
    useEffect(() => {
        let isMounted = true;
        const fetchMovie = async () => {
            if (!movieId) {
                if (isMounted) { setError('Movie ID missing.'); setLoadingMovie(false); setMovie(null); }
                return;
            }
            console.log(`[EFFECT 1] Fetching movie: ${movieId}`);
            if (isMounted) { setLoadingMovie(true); setError(null); setMovie(null); }
            try {
                const movieData = await getMovieByIdApi(movieId);
                console.log('[EFFECT 1] Movie API response:', movieData);
                if (isMounted) {
                    if (movieData?._id) {
                        setMovie(movieData);
                        console.log('[EFFECT 1] Movie state SET.');
                    } else {
                        setError('Movie not found or invalid data received.');
                        setMovie(null);
                    }
                }
            } catch (err) {
                console.error("[EFFECT 1] Error fetching movie:", err);
                if (isMounted) { setError(err?.response?.data?.msg || err.message || 'Failed to load movie.'); setMovie(null); }
            } finally {
                if (isMounted) setLoadingMovie(false);
            }
        };
        fetchMovie();
        return () => { isMounted = false; };
    }, [movieId]);

    // --- Effect 2: Fetch Reviews (runs AFTER movie is loaded) ---
    useEffect(() => {
        let isMounted = true;
        const fetchReviews = async () => {
            console.log(`[EFFECT 2] Fetching reviews for movie: ${movie?._id}`);
            setLoadingReviews(true); setReviewsError(null); setReviews([]);
            try {
                const reviewData = await getReviewsForMovieApi(movieId);
                console.log('[EFFECT 2] Reviews API response:', reviewData);
                if (isMounted) setReviews(Array.isArray(reviewData) ? reviewData : []);
            } catch (err) {
                console.error("[EFFECT 2] Review fetch error:", err);
                if (isMounted) { setReviewsError(err.message || 'Failed to load reviews.'); setReviews([]); }
            } finally {
                if (isMounted) setLoadingReviews(false);
            }
        };
        if (!loadingMovie && movie && movieId) { fetchReviews(); }
        else { setLoadingReviews(false); }
        return () => { isMounted = false; };
    }, [movieId, movie, loadingMovie]);

    // --- Effect 3: Fetch Showtimes (runs AFTER movie is loaded) ---
    useEffect(() => {
        let isMounted = true;
        const fetchShowtimes = async () => {
            const formattedDate = formatDate(selectedDate);
            console.log(`[EFFECT 3] Fetching showtimes for movie: ${movie?._id}, date: ${formattedDate}`);
            setLoadingShowtimes(true); setShowtimesError(null); setShowtimes([]);
            try {
                const params = { movieId: movieId, date: formattedDate, sort: 'startTime_asc' };
                const response = await getShowtimesApi(params);
                console.log('[EFFECT 3] Showtimes API response:', response);
                if (isMounted) setShowtimes(response?.data || []);
            } catch (err) {
                 console.error("[EFFECT 3] Showtime fetch error:", err);
                 if (isMounted) { setShowtimesError(err.message || 'Failed to load showtimes.'); setShowtimes([]); }
            } finally {
                if (isMounted) setLoadingShowtimes(false);
            }
        };
        if (!loadingMovie && movie && movieId) { fetchShowtimes(); }
        else { setLoadingShowtimes(false); }
        return () => { isMounted = false; };
    }, [movieId, selectedDate, movie, loadingMovie]);


    // --- Render Logic ---

    if (loadingMovie) {
        console.log('[Render] Showing main loading spinner.');
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    }
    if (error) {
        console.log('[Render] Showing main error alert:', error);
        return <Container sx={{ py: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }
    if (!movie) {
        console.log('[Render] Showing movie not found alert (movie state is null/undefined).');
        return <Container sx={{ py: 4 }}><Alert severity="warning">Movie details could not be loaded or movie not found.</Alert></Container>;
    }

    console.log('[Render] Rendering main content with movie data:', movie.title);

    const showtimesByVenue = Array.isArray(showtimes) ? showtimes.reduce((acc, showtime) => {
         const venueName = showtime.venue?.name || 'Unknown Venue';
         if (!acc[venueName]) { acc[venueName] = { venue: showtime.venue, times: [] }; }
         acc[venueName].times.push(showtime);
         return acc;
    }, {}) : {};

    const youtubeVideoId = getYouTubeVideoId(movie.trailerUrl);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                    {/* Left Column: Poster / Trailer */}
                    <Grid item xs={12} md={4}>
                        {youtubeVideoId ? (
                            <Box
                                sx={{
                                    width: '100%',
                                    position: 'relative',
                                    paddingBottom: '56.25%', // 16:9 aspect ratio
                                    height: 0,
                                    overflow: 'hidden',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    bgcolor: 'black'
                                }}
                            >
                                <iframe
                                    // Corrected YouTube embed URL format
                                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`${movie.title} Trailer`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%'
                                    }}
                                ></iframe>
                            </Box>
                        ) : (
                            <Box
                                component="img"
                                sx={{ width: '100%', maxHeight: { xs: 400, md: 550 }, objectFit: 'contain', borderRadius: 2, boxShadow: 3, bgcolor: 'grey.200' }}
                                alt={`${movie.title} poster`}
                                src={movie.posterUrl || "https://placehold.co/300x450/cccccc/ffffff?text=No+Image"}
                                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/300x450/cccccc/ffffff?text=No+Image"; }}
                            />
                        )}
                        {!youtubeVideoId && movie.trailerUrl && (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<PlayCircleFilledIcon />}
                                sx={{ mt: 2, width: '100%' }}
                                onClick={() => window.open(movie.trailerUrl, '_blank')}
                            >
                                Watch Trailer
                            </Button>
                        )}
                    </Grid>

                    {/* Right Column: Details */}
                    <Grid item xs={12} md={8}>
                        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {movie.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Rating value={movie.averageRating || 0} precision={0.5} readOnly />
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                ({movie.averageRating?.toFixed(1) || 'N/A'}/5) - {movie.numberOfReviews || 0} Reviews
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip icon={<AccessTimeIcon />} label={`${movie.duration || 'N/A'} min`} size="small" variant="outlined" />
                            <Chip icon={<LanguageIcon />} label={movie.movieLanguage || 'N/A'} size="small" variant="outlined" />
                            <Chip label={`Rated ${movie.censorRating || 'N/A'}`} size="small" variant="outlined" />
                            {movie.releaseDate && <Chip icon={<CalendarMonthIcon />} label={`Released: ${new Date(movie.releaseDate).toLocaleDateString('en-IN')}`} size="small" variant="outlined" />}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            {Array.isArray(movie.genre) && movie.genre.map((g) => (
                                <Chip key={g} label={g} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                        </Box>
                        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                            {movie.description || 'No description available.'}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                {/* Showtimes Section */}
                <Box component="section" sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                           Showtimes
                        </Typography>
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                            format="ddd, DD MMM YYYY"
                            disablePast={false}
                        />
                    </Box>

                    {showtimesError && <Alert severity="warning" sx={{my: 2}}>{showtimesError}</Alert>}
                    {loadingShowtimes ? (
                         <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>
                    ) : Object.keys(showtimesByVenue).length > 0 ? (
                        Object.entries(showtimesByVenue).map(([venueName, data]) => (
                           <Box key={venueName} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                               <Typography variant="h6" component="h3" gutterBottom>{venueName}</Typography>
                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                   {data.times.map(show => (
                                       <Button key={show._id} variant="outlined" color="error" component={RouterLink} to={`/book/${show._id}`} >
                                           {dayjs(show.startTime).format('h:mm A')}
                                           <Typography variant='caption' sx={{ml: 0.5}}> ({show.screenName})</Typography>
                                       </Button>
                                   ))}
                               </Box>
                           </Box>
                        ))
                    ) : ( <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No showtimes available for {selectedDate.format('DD MMM YYYY')}.</Typography> )}
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* Reviews Section */}
                <Box component="section">
                     <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}> User Reviews ({reviews.length}) </Typography>
                     {reviewsError && <Alert severity="warning" sx={{my: 2}}>{reviewsError}</Alert>}
                     {loadingReviews ? <CircularProgress color="error" size={30} /> : (
                        Array.isArray(reviews) && reviews.length > 0 ? (
                             <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                                {reviews.map((review, index) => (
                                     <React.Fragment key={review._id}>
                                         <ListItem alignItems="flex-start">
                                             <ListItemAvatar><Avatar sx={{ bgcolor: 'secondary.main' }}>{review.user?.name?.charAt(0) || 'U'}</Avatar></ListItemAvatar>
                                             <ListItemText
                                                 primary={ <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}> <Typography sx={{ mr: 1, fontWeight: 'medium' }}>{review.user?.name || 'Anonymous'}</Typography> <Rating name={`rating-${review._id}`} value={review.rating} precision={0.5} size="small" readOnly /> </Box> }
                                                 secondary={review.comment || 'No comment.'}
                                             />
                                              <Typography variant="caption" color="text.secondary"> {new Date(review.createdAt).toLocaleDateString('en-IN')} </Typography>
                                         </ListItem>
                                         {index < reviews.length - 1 && <Divider variant="inset" component="li" />}
                                     </React.Fragment>
                                 ))}
                             </List>
                         ) : ( <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No reviews yet.</Typography> )
                     )}
                 </Box>
            </Paper>
        </Container>
    );
};

export default MovieDetailsPage;