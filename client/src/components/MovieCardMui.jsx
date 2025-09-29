// client/src/components/MovieCardMui.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Card, CardActionArea, CardContent, CardMedia, Typography, Skeleton, Box,
    IconButton, Dialog, DialogContent, Rating, Chip
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StarIcon from '@mui/icons-material/Star';

const PLACEHOLDER_IMAGE = "https://placehold.co/300x450/cccccc/ffffff?text=No+Image";

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
    } catch (error) {
        console.error("Invalid trailer URL format:", url);
        return null;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
};

const MovieCardMui = ({ movie, isLoading, showTrailerButton = false }) => {
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    if (isLoading) {
        return (
            <Card sx={{ width: '100%', height: '100%' }}>
                <Skeleton variant="rectangular" sx={{ height: 330 }} />
                <CardContent>
                    <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
                    <Skeleton variant="text" width="60%" />
                </CardContent>
            </Card>
        );
    }

    if (!movie) return null;

    const imageUrl = movie.posterUrl || PLACEHOLDER_IMAGE;
    const title = movie.title || 'Untitled Movie';
    const genres = Array.isArray(movie.genre) ? movie.genre.join(', ') : 'N/A';
    const language = movie.movieLanguage || 'N/A';
    const embedUrl = getYouTubeEmbedUrl(movie.trailerUrl);

    const handleTrailerOpen = (event) => {
        event.stopPropagation();
        event.preventDefault();
        if (embedUrl) {
            setIsTrailerOpen(true);
        }
    };

    const handleTrailerClose = () => {
        setIsTrailerOpen(false);
    };

    return (
        <>
            <Card sx={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}>
                <CardActionArea component={RouterLink} to={`/movies/${movie._id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', width: '100%', height: 330 }}>
                        <CardMedia
                            component="img"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            image={imageUrl}
                            alt={`${title} poster`}
                            onError={(e) => { e.target.onerror = null; e.target.src=PLACEHOLDER_IMAGE }}
                        />
                        {showTrailerButton && embedUrl && (
                             <Box
                                sx={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    bgcolor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
                                    justifyContent: 'center', alignItems: 'center',
                                    opacity: 0, transition: 'opacity 0.3s ease',
                                    '&:hover': { opacity: 1 }
                                }}
                            >
                                <IconButton onClick={handleTrailerOpen} sx={{ color: 'white' }}>
                                    <PlayCircleOutlineIcon sx={{ fontSize: '4rem' }} />
                                </IconButton>
                            </Box>
                        )}
                    </Box>
                    <CardContent sx={{ flexGrow: 1, width: '100%' }}>
                        <Typography gutterBottom variant="h6" component="div" noWrap title={title} sx={{ fontSize: '1rem', mb: 0.5 }}>
                            {title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StarIcon color="error" sx={{ fontSize: '1rem', mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                {movie.averageRating?.toFixed(1) || 'N/A'}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" noWrap title={genres} sx={{ mb: 1 }}>
                            {genres}
                        </Typography>
                         <Chip label={language} size="small" variant="outlined" />
                    </CardContent>
                </CardActionArea>
            </Card>

            <Dialog open={isTrailerOpen} onClose={handleTrailerClose} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, aspectRatio: '16/9', overflow: 'hidden' }}>
                    {embedUrl && (
                        <iframe
                            width="100%" height="100%" src={embedUrl}
                            title={`${title} Trailer`} frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MovieCardMui;