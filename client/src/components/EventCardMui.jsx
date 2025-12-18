// client/src/components/EventCardMui.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const PLACEHOLDER_IMAGE = "https://placehold.co/300x450/orange/white";

const EventCardMui = ({ event, isLoading }) => {

  if (isLoading) {
     return (
       <Card sx={{ maxWidth: 345, width: '100%', height: '100%' }}>
         <Skeleton variant="rectangular" sx={{ height: 140 }} />
         <CardContent>
           <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 1 }} />
           <Skeleton variant="text" width="80%" sx={{ fontSize: '0.8rem', mb: 1 }} />
           <Skeleton variant="text" width="40%" sx={{ fontSize: '0.7rem' }}/>
         </CardContent>
       </Card>
     );
   }

   if (!event) return null;

   const imageUrl = event.imageUrl || PLACEHOLDER_IMAGE;
   const title = event.title || 'Untitled Event';
   const category = event.category || 'N/A';
   const city = event.address?.city || 'TBA';
   const startDate = event.startDate ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA';

  return (
    <Card sx={{
         maxWidth: 345, width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
         transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
         '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
        }}
    >
      <CardActionArea component={RouterLink} to={`/events/${event._id}`} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          sx={{ height: 140, objectFit: 'cover' }}
          image={imageUrl}
          alt={`${title} poster`}
          onError={(e) => { e.target.onerror = null; e.target.src=PLACEHOLDER_IMAGE }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" title={title} sx={{ fontSize: '1rem', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap title={category} sx={{ fontSize: '0.8rem', mb: 1 }}>
            {category}
          </Typography>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CalendarMonthIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {startDate}
                </Typography>
            </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {city}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default EventCardMui;