// client/src/components/MovieCardMui.jsx (Corrected)
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

const PLACEHOLDER_IMAGE = "https://placehold.co/300x450/orange/white";

// Accept movie OR event, and isLoading prop
const MovieCardMui = ({ movie, isLoading }) => {

  // Render Skeleton if isLoading prop is true
  if (isLoading) {
    return (
      <Card sx={{ maxWidth: 345, width: '100%', height: '100%' }}> {/* Ensure skeleton takes height */}
        <Skeleton variant="rectangular" sx={{ height: 250 }} /> {/* Match image height */}
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
          <Skeleton variant="text" width="60%" sx={{ fontSize: '0.8rem', mb: 1 }}/>
          <Skeleton variant="text" width="40%" sx={{ fontSize: '0.7rem' }}/>
        </CardContent>
      </Card>
    );
  }

  // If not loading, but no movie data, render nothing or an error card
  if (!movie) return null;

  // Extract data safely
  const imageUrl = movie.posterUrl || PLACEHOLDER_IMAGE;
  const title = movie.title || 'Untitled Movie';
  const genres = Array.isArray(movie.genre) ? movie.genre.join(', ') : 'N/A';
  const language = movie.language || movie.movieLanguage || 'N/A'; // Handle both possible field names

  return (
    <Card sx={{
        maxWidth: 345, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
        }}
    >
      {/* Link the whole clickable area */}
      <CardActionArea component={RouterLink} to={`/movies/${movie._id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          sx={{ height: 250, objectFit: 'cover' }} // Use sx prop for height
          image={imageUrl}
          alt={`${title} poster`}
          onError={(e) => { e.target.onerror = null; e.target.src=PLACEHOLDER_IMAGE }}
        />
        <CardContent sx={{ flexGrow: 1 }}> {/* Content takes remaining space */}
          <Typography gutterBottom variant="h6" component="div" noWrap title={title} sx={{ fontSize: '1rem', mb: 0.5 }}> {/* Adjusted font size/margin */}
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap title={genres} sx={{ fontSize: '0.8rem', mb: 0.5 }}> {/* Adjusted font size/margin */}
            {genres}
          </Typography>
           <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.75rem' }}> {/* Adjusted font size */}
              {language}
          </Typography>
           {/* Add rating later */}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default MovieCardMui;