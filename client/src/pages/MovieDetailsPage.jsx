// client/src/pages/MovieDetailsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// API Calls
import { getMovieByIdApi, checkReviewEligibilityApi } from '../api/movies';
import { getShowtimesApi } from '../api/showtimes';
import { getReviewsForMovieApi, likeReviewApi, dislikeReviewApi, reportReviewApi } from '../api/reviews';
// MUI Components
import {
    Container, Grid, Box, Typography, Chip, CircularProgress, Alert, Rating,
    Divider, Paper, List, ListItem, ListItemText, Avatar, ListItemAvatar, Button,
    Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import dayjs from 'dayjs';
// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanguageIcon from '@mui/icons-material/Language';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FlagIcon from '@mui/icons-material/Flag';
import CreateIcon from '@mui/icons-material/Create';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

const formatDate = (date) => dayjs(date).format('YYYY-MM-DD');

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId = null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        }
    } catch (error) { return null; }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
};


const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const showtimesRef = useRef(null); // Ref for scrolling to showtimes

    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState({ movie: true, showtimes: false, reviews: false, eligibility: true });
    const [error, setError] = useState({ movie: null, showtimes: null, reviews: null });
    const [selectedDate, setSelectedDate] = useState(dayjs().startOf('day'));
    const [eligibility, setEligibility] = useState({ isEligible: false, reason: '' });
    const [reportState, setReportState] = useState({ open: false, reviewId: null, reason: '' });
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    const dateOptions = Array.from({ length: 7 }, (_, i) => dayjs().add(i, 'day'));

    const fetchMovieAndReviews = useCallback(async () => {
        setLoading(prev => ({ ...prev, movie: true, reviews: true }));
        try {
            const [movieData, reviewData] = await Promise.all([
                getMovieByIdApi(movieId),
                getReviewsForMovieApi(movieId)
            ]);
            setMovie(movieData);
            setReviews(Array.isArray(reviewData) ? reviewData : []);
        } catch (err) {
            setError(prev => ({ ...prev, movie: err.message || 'Failed to load details' }));
        } finally {
            setLoading(prev => ({ ...prev, movie: false, reviews: false }));
        }
    }, [movieId]);

    const checkEligibility = useCallback(async () => {
        if (!isAuthenticated) {
            setEligibility({ isEligible: false, reason: 'You must be logged in to write a review.' });
            setLoading(prev => ({...prev, eligibility: false}));
            return;
        }
        setLoading(prev => ({...prev, eligibility: true}));
        try {
            const data = await checkReviewEligibilityApi(movieId);
            let reasonMessage = '';
            if (!data.isEligible) {
                if (data.reason === 'already_reviewed') reasonMessage = "You have already reviewed this movie.";
                else if (data.reason === 'no_booking') reasonMessage = "You must have a confirmed past booking to review this movie.";
                else reasonMessage = "You are not eligible to review this movie.";
            }
            setEligibility({ isEligible: data.isEligible, reason: reasonMessage });
        } catch (err) {
            setEligibility({ isEligible: false, reason: 'Could not check eligibility at this time.' });
        } finally {
            setLoading(prev => ({...prev, eligibility: false}));
        }
    }, [movieId, isAuthenticated]);

    useEffect(() => {
        fetchMovieAndReviews();
        checkEligibility();
    }, [fetchMovieAndReviews, checkEligibility]);

    useEffect(() => {
        let isMounted = true;
        const fetchShowtimes = async () => {
            if (!movie) return;
            const formattedDate = formatDate(selectedDate);
            setLoading(prev => ({ ...prev, showtimes: true }));
            setError(prev => ({ ...prev, showtimes: null }));
            try {
                const params = { movieId, date: formattedDate, sort: 'startTime_asc' };
                const response = await getShowtimesApi(params);
                if (isMounted) setShowtimes(response?.data || []);
            } catch (err) {
                 if (isMounted) setError(prev => ({ ...prev, showtimes: err.message || 'Failed to load showtimes.' }));
            } finally {
                if (isMounted) setLoading(prev => ({ ...prev, showtimes: false }));
            }
        };
        fetchShowtimes();
        return () => { isMounted = false; };
    }, [movieId, selectedDate, movie]);

    const handleInteraction = async (reviewId, action) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/movies/${movieId}` } } });
            return;
        }
        const originalReviews = JSON.parse(JSON.stringify(reviews));
        const updatedReviews = reviews.map(r => {
            if (r._id === reviewId) {
                const isLiked = r.likes.includes(user._id);
                const isDisliked = r.dislikes.includes(user._id);
                let newLikes = [...r.likes];
                let newDislikes = [...r.dislikes];
                if (action === 'like') {
                    if (isLiked) { newLikes = newLikes.filter(id => id !== user._id); }
                    else { newLikes.push(user._id); newDislikes = newDislikes.filter(id => id !== user._id); }
                } else if (action === 'dislike') {
                    if (isDisliked) { newDislikes = newDislikes.filter(id => id !== user._id); }
                    else { newDislikes.push(user._id); newLikes = newLikes.filter(id => id !== user._id); }
                }
                return { ...r, likes: newLikes, dislikes: newDislikes };
            }
            return r;
        });
        setReviews(updatedReviews);
        try {
            if (action === 'like') await likeReviewApi(reviewId);
            else if (action === 'dislike') await dislikeReviewApi(reviewId);
        } catch (err) {
            console.error(`Failed to ${action} review`, err);
            setReviews(originalReviews);
            alert(`Error: ${err.msg || 'Action failed'}`);
        }
    };
    
    const handleReportSubmit = async () => {
        if (!reportState.reason.trim()) return;
        try {
            const res = await reportReviewApi(reportState.reviewId, reportState.reason);
            alert(res.msg || 'Report submitted successfully. Our team will review it shortly.');
            setReportState({ open: false, reviewId: null, reason: '' });
        } catch (err) {
            alert(`Error: ${err.msg || 'Could not submit report.'}`);
        }
    };

    const handleBookTicketsClick = () => {
        showtimesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading.movie) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="error" /></Box>;
    if (error.movie) return <Container sx={{ py: 4 }}><Alert severity="error">{error.movie}</Alert></Container>;
    if (!movie) return <Container sx={{ py: 4 }}><Alert severity="warning">Movie details not found.</Alert></Container>;

    const showtimesByVenue = Array.isArray(showtimes) ? showtimes.reduce((acc, showtime) => {
        const venueName = showtime.venue?.name || 'Unknown Venue';
        if (!acc[venueName]) { acc[venueName] = { venue: showtime.venue, times: [] }; }
        acc[venueName].times.push(showtime);
        return acc;
    }, {}) : {};

    const embedUrl = getYouTubeEmbedUrl(movie.trailerUrl);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 3, '&:hover .trailer-overlay': { opacity: 1 } }}>
                            <Box
                                component="img"
                                sx={{ width: '100%', height: 'auto', display: 'block' }}
                                alt={`${movie.title} poster`}
                                src={movie.posterUrl || "https://placehold.co/300x450/cccccc/ffffff?text=No+Image"}
                            />
                            {embedUrl && (
                                <Box
                                    className="trailer-overlay"
                                    sx={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        bgcolor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
                                        justifyContent: 'center', alignItems: 'center',
                                        opacity: 0, transition: 'opacity 0.3s ease', cursor: 'pointer'
                                    }}
                                    onClick={() => setIsTrailerOpen(true)}
                                >
                                    <IconButton sx={{ color: 'white' }}>
                                        <PlayCircleOutlineIcon sx={{ fontSize: '5rem' }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>{movie.title}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Rating value={movie.averageRating || 0} precision={0.5} readOnly />
                            <Typography variant="body2" sx={{ ml: 1 }}>({movie.averageRating?.toFixed(1) || 'N/A'}/5) - {movie.numberOfReviews || 0} Reviews</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip icon={<AccessTimeIcon />} label={`${movie.duration || 'N/A'} min`} size="small" variant="outlined" />
                            <Chip icon={<LanguageIcon />} label={movie.movieLanguage || 'N/A'} size="small" variant="outlined" />
                            <Chip label={`Rated ${movie.censorRating || 'N/A'}`} size="small" variant="outlined" />
                            {movie.releaseDate && <Chip icon={<CalendarMonthIcon />} label={`Released: ${dayjs(movie.releaseDate).format('DD MMM YYYY')}`} size="small" variant="outlined" />}
                        </Box>
                        <Box sx={{ mb: 2 }}>{Array.isArray(movie.genre) && movie.genre.map((g) => (<Chip key={g} label={g} size="small" sx={{ mr: 0.5, mb: 0.5 }} />))}</Box>
                        <Typography variant="body1" paragraph sx={{ mb: 3 }}>{movie.description || 'No description available.'}</Typography>
                        
                        <Button variant="contained" color="error" size="large" onClick={handleBookTicketsClick}>
                            Book Tickets
                        </Button>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box component="section" sx={{ mb: 4 }} ref={showtimesRef}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>Showtimes</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1, '-webkit-overflow-scrolling': 'touch', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        {dateOptions.map((date, index) => {
                            const isSelected = dayjs(date).isSame(selectedDate, 'day');
                            return (
                                <Chip
                                    key={index}
                                    label={
                                        <Box sx={{textAlign: 'center', textTransform: 'uppercase'}}>
                                            <Typography variant="caption" display="block">{index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : date.format('ddd')}</Typography>
                                            <Typography variant="body1" sx={{fontWeight: 'bold'}}>{date.format('DD')}</Typography>
                                            <Typography variant="caption" display="block">{date.format('MMM')}</Typography>
                                        </Box>
                                    }
                                    clickable
                                    onClick={() => setSelectedDate(date)}
                                    sx={{
                                        height: 'auto', p: 1.5, borderRadius: 2,
                                        bgcolor: isSelected ? 'error.main' : 'grey.200',
                                        color: isSelected ? 'white' : 'text.primary',
                                        '&:hover': { bgcolor: isSelected ? 'error.dark' : 'grey.300' }
                                    }}
                                />
                            );
                        })}
                    </Box>
                    {error.showtimes && <Alert severity="warning" sx={{my: 2}}>{error.showtimes}</Alert>}
                    {loading.showtimes ? (<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress color="error" /></Box>)
                    : Object.keys(showtimesByVenue).length > 0 ? (
                        Object.entries(showtimesByVenue).map(([venueName, data]) => (
                           <Box key={venueName} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                               <Typography variant="h6" component="h3" gutterBottom>{venueName}</Typography>
                               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                   {data.times.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(show => (
                                       <Button key={show._id} variant="outlined" color="error" component={RouterLink} to={`/book/${show._id}`} >
                                           {dayjs(show.startTime).format('h:mm A')}
                                           <Typography variant='caption' sx={{ml: 0.5}}>({show.screenName})</Typography>
                                       </Button>
                                   ))}
                               </Box>
                           </Box>
                        ))
                    ) : ( <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No showtimes available for {selectedDate.format('DD MMM YYYY')}.</Typography> )}
                </Box>

                <Divider sx={{ my: 4 }} />

                <Box component="section">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}> User Reviews ({reviews.length}) </Typography>
                        <Tooltip title={eligibility.isEligible ? 'Write your review for this movie' : (eligibility.reason || 'Check eligibility...')}>
                            <span>
                                <Button
                                    variant="contained" startIcon={<CreateIcon />}
                                    component={RouterLink} to={`/movies/${movieId}/review`}
                                    disabled={!eligibility.isEligible || loading.eligibility}
                                >
                                    Write a Review
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                    {error.reviews && <Alert severity="warning" sx={{my: 2}}>{error.reviews}</Alert>}
                    {loading.reviews ? <CircularProgress /> : (
                        reviews.length > 0 ? (
                            <List sx={{ bgcolor: 'background.paper' }}>
                                {reviews.map((review, index) => (
                                    <React.Fragment key={review._id}>
                                        <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', py: 2 }}>
                                            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                                <ListItemAvatar><Avatar sx={{ bgcolor: 'secondary.main' }}>{review.user?.name?.charAt(0) || 'U'}</Avatar></ListItemAvatar>
                                                <ListItemText
                                                    primary={ <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}> <Typography sx={{ fontWeight: 'medium' }}>{review.user?.name || 'Anonymous'}</Typography> <Rating value={review.rating} precision={0.5} size="small" readOnly /> </Box> }
                                                    secondary={dayjs(review.createdAt).format('DD MMMM YYYY')}
                                                />
                                            </Box>
                                            <Typography variant="body2" sx={{ my: 1.5, pl: '56px', color: 'text.primary', whiteSpace: 'pre-wrap' }}>{review.comment || <em>No comment provided.</em>}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: '56px', width: '100%' }}>
                                                <Button size="small" startIcon={<ThumbUpIcon />} onClick={() => handleInteraction(review._id, 'like')} color={review.likes.includes(user?._id) ? "primary" : "inherit"}> {review.likes.length} </Button>
                                                <Button size="small" startIcon={<ThumbDownIcon />} onClick={() => handleInteraction(review._id, 'dislike')} color={review.dislikes.includes(user?._id) ? "error" : "inherit"}> {review.dislikes.length} </Button>
                                                <Tooltip title="Report this review as inappropriate">
                                                    <IconButton size="small" onClick={() => { if (!isAuthenticated) navigate('/login', { state: { from: { pathname: `/movies/${movieId}` } } }); else setReportState({ open: true, reviewId: review._id, reason: '' }); }}>
                                                        <FlagIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </ListItem>
                                        {index < reviews.length - 1 && <Divider variant="inset" component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>No reviews yet. Be the first to share your thoughts!</Typography>
                    )}
                </Box>
            </Paper>

            <Dialog open={reportState.open} onClose={() => setReportState({ open: false, reviewId: null, reason: '' })} fullWidth maxWidth="xs">
                <DialogTitle>Report Review</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Please provide a brief reason for reporting this review.</Typography>
                    <TextField autoFocus margin="dense" id="reason" label="Reason" type="text" fullWidth variant="standard" value={reportState.reason} onChange={(e) => setReportState(prev => ({ ...prev, reason: e.target.value }))} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReportState({ open: false, reviewId: null, reason: '' })}>Cancel</Button>
                    <Button onClick={handleReportSubmit} disabled={!reportState.reason.trim()}>Submit Report</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, aspectRatio: '16/9', overflow: 'hidden' }}>
                    {embedUrl && (
                        <iframe width="100%" height="100%" src={embedUrl} title={`${movie.title} Trailer`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default MovieDetailsPage;