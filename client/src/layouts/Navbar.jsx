// client/src/layouts/Navbar.jsx
import React, { useState } from 'react'; // Added useState
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    AppBar, Toolbar, Typography, Button, Box, Container, Link as MuiLink,
    CircularProgress, IconButton, TextField, InputAdornment
} from '@mui/material'; // Added TextField, InputAdornment
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search'; // Added SearchIcon

function Navbar() {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery(''); // Optionally clear search bar after submit
        }
    };

    return (
        <AppBar position="sticky" sx={{ bgcolor: 'grey.900', boxShadow: 1 }}>
            <Container maxWidth="xl"> {/* Changed to xl for more space if needed */}
                <Toolbar disableGutters>
                    <Typography
                        variant="h6" noWrap component={RouterLink} to="/"
                        sx={{ mr: 2, display: { xs: 'none', md: 'flex' }, fontWeight: 700, color: 'error.main', textDecoration: 'none', '&:hover': { color: 'error.light',} }}
                    >
                        BookNOW
                    </Typography>

                    {/* Mobile Menu Icon & Search - Placeholder for more complex mobile nav */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                        {/* <IconButton size="large" aria-label="menu" color="inherit" sx={{ mr: 1 }} > <MenuIcon /> </IconButton> */}
                         <Typography
                            variant="h6" noWrap component={RouterLink} to="/"
                            sx={{ fontWeight: 700, color: 'error.main', textDecoration: 'none', flexGrow: 1 }}
                        >
                            BookNOW
                        </Typography>
                    </Box>
                    

                    {/* Desktop Search Bar & Links Area */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', px: 2 }}>
                        <Box component="form" onSubmit={handleSearchSubmit} sx={{ width: '100%', maxWidth: 500 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="Search movies, events, venues..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 1,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                                        '&.Mui-focused fieldset': { borderColor: 'error.light' },
                                        color: 'white',
                                    },
                                    '& .MuiInputBase-input': {
                                        color: 'white',
                                        fontSize: '0.9rem',
                                    },
                                    '& .MuiInputAdornment-root': {
                                        color: 'rgba(255,255,255,0.7)',
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Auth Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}> {/* Reduced gap slightly */}
                        {isLoading ? (
                            <CircularProgress color="inherit" size={24} />
                        ) : isAuthenticated ? (
                            <>
                                <Typography sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }} variant="body2">
                                    Hi, {user?.name?.split(' ')[0] || 'User'}! {/* Show first name */}
                                </Typography>
                                {user?.role === 'admin' && <Button color="inherit" component={RouterLink} to="/admin" size="small" sx={{minWidth: 'auto', px:1}}>Admin</Button>}
                                {user?.role === 'organizer' && <Button color="inherit" component={RouterLink} to="/organizer" size="small" sx={{minWidth: 'auto', px:1}}>Organizer</Button>}
                                <Button color="inherit" component={RouterLink} to="/dashboard?tab=bookings" size="small" sx={{minWidth: 'auto', px:1}}>My Account</Button>
                                <Button color="error" variant='outlined' size="small" onClick={handleLogout} sx={{minWidth: 'auto', px:1}}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Button color="inherit" component={RouterLink} to="/login" size="small" sx={{minWidth: 'auto', px:1}}>Login</Button>
                                <Button color="inherit" component={RouterLink} to="/register" size="small" sx={{minWidth: 'auto', px:1}}>Register</Button>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;