// File: /client/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
// MUI Components
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, googleLogin, isLoading, authError, setAuthError } = useAuth(); // Get error setter
  const navigate = useNavigate();

  // Clear authError when component mounts or unmounts
  useEffect(() => {
      setAuthError(null); // Clear on mount
      return () => {
          setAuthError(null); // Clear on unmount
      };
  }, [setAuthError]);


  const handleChange = (e) => {
    setAuthError(null); // Clear error when user types
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null); // Clear previous errors before attempt
    if (!formData.email || !formData.password) {
        setAuthError("Please enter both email and password."); // Use authError for consistency
        return;
    }

    // The login function in context now returns true/false and handles errors internally
    const success = await login(formData);
    if (success) {
        console.log("Login successful, navigating...");
        navigate('/'); // Only navigate on true success
    } else {
        // Error message should already be set in authError state by the context
        console.log("Login failed, error message should be displayed.");
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {/* Display authError from context */}
          {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}

          <TextField
            margin="normal" required fullWidth id="email" label="Email Address" name="email"
            autoComplete="email" autoFocus value={formData.email} onChange={handleChange} disabled={isLoading}
          />
          <TextField
            margin="normal" required fullWidth name="password" label="Password" type="password" id="password"
            autoComplete="current-password" value={formData.password} onChange={handleChange} disabled={isLoading}
          />
          <Box sx={{ textAlign: 'right', my: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" color="error">
               Forgot password?
             </Link>
           </Box>
          <Button
            type="submit" fullWidth variant="contained" color="error"
            sx={{ mt: 3, mb: 2 }} disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={googleLogin}
            sx={{ mb: 2 }}
          >
            Sign In with Google
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/register" variant="body2" color="error">
                {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;