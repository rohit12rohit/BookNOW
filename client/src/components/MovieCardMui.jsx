// client/src/components/MovieCardMui.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';

const PLACEHOLDER_IMAGE = "https://placehold.co/300x450/cccccc/ffffff?text=No+Image";

const MovieCardMui = ({ movie, isLoading }) => {
    if (isLoading) { /* ... skeleton code unchanged ... */ }
    if (!movie) return null;

    return (
        <Card sx={{ maxWidth: 345, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
            <CardActionArea component={RouterLink} to={`/movies/${movie._id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardMedia component="img" sx={{ height: 250, objectFit: 'cover' }} image={movie.posterUrl || PLACEHOLDER_IMAGE} alt={`${movie.title} poster`} onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }} />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap title={movie.title} sx={{ fontSize: '1rem', mb: 0.5 }}>{movie.title}</Typography>
                    
                    {movie.averageRating > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <Rating value={movie.averageRating} precision={0.5} size="small" readOnly />
                            <Typography variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>({movie.numberOfReviews})</Typography>
                        </Box>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem', mb: 0.5 }}>{(movie.genre || []).join(', ')}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{movie.movieLanguage}</Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MovieCardMui;