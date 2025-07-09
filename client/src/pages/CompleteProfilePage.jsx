// client/src/pages/CompleteProfilePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { completeProfileApi } from '../api/auth';
import { Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const CompleteProfilePage = () => {
    const { user, loadUser } = useAuth();
    const [formData, setFormData] = useState({ name: user?.name || '', dob: null });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.dob) return setError('Name and Date of Birth are required.');
        setError(''); setIsLoading(true);
        try {
            await completeProfileApi({ name: formData.name, dob: formData.dob });
            await loadUser(localStorage.getItem('authToken')); // Refresh user data
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                <Typography component="h1" variant="h5">Complete Your Profile</Typography>
                <Typography sx={{ my: 2 }}>Welcome! Just a few more details to get you started.</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField margin="normal" required fullWidth label="Full Name" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} />
                    <DatePicker label="Date of Birth" disableFuture onChange={date => setFormData(p => ({...p, dob: date}))} slotProps={{ textField: { fullWidth: true, required: true, margin: "normal" } }} />
                    <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2 }} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : 'Save and Continue'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default CompleteProfilePage;