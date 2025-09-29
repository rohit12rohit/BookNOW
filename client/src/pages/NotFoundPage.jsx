// client/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const NotFoundPage = () => {
  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'error.light' }}>
        404
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 2, mb: 3 }}>
        Oops! Page Not Found.
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Sorry, the page you are looking for does not exist or may have been moved.
      </Typography>
      <Button
        variant="contained"
        color="error"
        component={RouterLink}
        to="/"
      >
        Go Back Home
      </Button>
    </Container>
  );
};

export default NotFoundPage;
