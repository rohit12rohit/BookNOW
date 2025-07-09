// // client/src/pages/RegisterPage.jsx (Corrected Submit Logic)
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate, Link as RouterLink } from 'react-router-dom';
// // MUI Components
// import Container from '@mui/material/Container';
// import Box from '@mui/material/Box';
// import TextField from '@mui/material/TextField';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import Alert from '@mui/material/Alert';
// import Link from '@mui/material/Link';
// import CircularProgress from '@mui/material/CircularProgress';
// import Paper from '@mui/material/Paper';
// import FormControl from '@mui/material/FormControl';
// import FormLabel from '@mui/material/FormLabel';
// import RadioGroup from '@mui/material/RadioGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import Radio from '@mui/material/Radio';

// const RegisterPage = () => {
//     const [formData, setFormData] = useState({
//         name: '', email: '', password: '', confirmPassword: '',
//         role: 'user', organizationName: ''
//     });
//     const [pageError, setPageError] = useState('');
//     // Get auth context functions and state
//     const { register, isLoading, authError, setAuthError } = useAuth();
//     const navigate = useNavigate();
//     const isOrganizer = formData.role === 'organizer';

//     // Clear errors when component mounts or unmounts
//     useEffect(() => {
//         setAuthError(null);
//         return () => { setAuthError(null); };
//     }, [setAuthError]);

//     const handleChange = (e) => {
//         setAuthError(null); // Clear API error on change
//         setPageError('');   // Clear page error on change
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleRoleChange = (e) => {
//         setAuthError(null); setPageError('');
//         setFormData({ ...formData, role: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setPageError(''); setAuthError(null); // Clear errors before submit

//         // Frontend Validations
//         if (formData.password !== formData.confirmPassword) {
//             setPageError("Passwords do not match."); return;
//         }
//         if (formData.password.length < 6) {
//              setPageError("Password must be at least 6 characters."); return;
//         }
//         if (isOrganizer && !formData.organizationName.trim()) {
//             setPageError("Organization name is required for organizers."); return;
//         }
//         if (!formData.name.trim()) {
//             setPageError("Full Name is required."); return;
//         }
//          if (!formData.email.trim()) { // Basic email presence check
//             setPageError("Email is required."); return;
//         }
//         // More robust email validation could be added here if desired

//         // Prepare data for API call
//         const apiData = {
//             name: formData.name.trim(),
//             email: formData.email.trim(),
//             password: formData.password,
//             role: formData.role,
//             ...(isOrganizer && { organizationName: formData.organizationName.trim() })
//         };

//         try {
//             // Call the register function from context, which returns { success: boolean, ... }
//             const result = await register(apiData);

//             // --- CORRECTED CHECK ---
//             // Explicitly check the 'success' property of the result object
//             if (result.success) {
//                 console.log("Registration successful, navigating...");
//                 // Optional: Show message if organizer needs approval
//                 if (formData.role === 'organizer' && !result.isApproved) {
//                     alert("Registration successful! Your organizer account requires admin approval before you can manage venues/showtimes or log in fully as an organizer.");
//                     // Redirect to login or homepage after showing message?
//                     navigate('/login');
//                 } else {
//                     // Redirect user or approved organizer to home
//                     navigate('/');
//                 }
//             } else {
//                 // Registration failed, error message should be set in authError by the context
//                 console.log("Registration failed, error should be displayed from context.");
//                 // No navigation needed here, error Alert will show
//             }
//             // --- END CORRECTION ---

//         } catch (error) {
//             // Catch unexpected errors not handled by context's try/catch
//              console.error("Unexpected error during registration submit:", error);
//              setPageError("An unexpected registration error occurred. Please try again.");
//         }
//     };

//     return (
//         <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
//             <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                 <Typography component="h1" variant="h5" gutterBottom> Register </Typography>
//                 <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
//                     {/* Display errors */}
//                     {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}
//                     {pageError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{pageError}</Alert>}

//                     {/* Form Fields */}
//                     <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
//                     <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
//                     <TextField margin="normal" required fullWidth name="password" label="Password (min 6 chars)" type="password" id="password" inputProps={{ minLength: 6 }} value={formData.password} onChange={handleChange} disabled={isLoading} />
//                     <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" inputProps={{ minLength: 6 }} value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />

//                     <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
//                         <FormLabel component="legend">Register As</FormLabel>
//                         <RadioGroup row name="role" value={formData.role} onChange={handleRoleChange}>
//                             <FormControlLabel value="user" control={<Radio size="small"/>} label="User" disabled={isLoading}/>
//                             <FormControlLabel value="organizer" control={<Radio size="small"/>} label="Organizer" disabled={isLoading}/>
//                         </RadioGroup>
//                     </FormControl>

//                     {isOrganizer && ( <TextField margin="normal" required={isOrganizer} fullWidth name="organizationName" label="Organization Name" id="organizationName" value={formData.organizationName} onChange={handleChange} disabled={isLoading} sx={{ mb: 2 }}/> )}

//                     <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2, mb: 2 }} disabled={isLoading}>
//                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
//                     </Button>
//                      <Box sx={{ textAlign: 'center' }}> <Link component={RouterLink} to="/login" variant="body2" color="error"> {"Already have an account? Sign In"} </Link> </Box>
//                 </Box>
//             </Paper>
//         </Container>
//     );
// };
// export default RegisterPage;




// // client/src/pages/RegisterPage.jsx
// import React, { useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { registerAndSendEmailOtpApi, sendOtpApi, verifyOtpApi } from '../api/auth';
// import { Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// const RegisterPage = () => {
//     const { state } = useLocation();
//     const navigate = useNavigate();
//     const { loginWithToken } = useAuth();

//     const isMobileSignup = !!state?.mobile;
    
//     const [step, setStep] = useState(1);
//     const [formData, setFormData] = useState({
//         name: '',
//         email: state?.email || '',
//         password: '',
//         confirmPassword: '',
//         dob: null,
//         mobileNumber: state?.mobile || ''
//     });
//     const [otp, setOtp] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);

//     const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
//     const handleDateChange = (date) => setFormData(prev => ({ ...prev, dob: date }));

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError('');
//         setIsLoading(true);

//         try {
//             if (isMobileSignup) {
//                 // Mobile signup flow
//                 if (!formData.name || !formData.dob) return setError('Name and Date of Birth are required.');
//                 await sendOtpApi(formData);
//                 setStep(2);
//             } else {
//                 // Email signup flow
//                 if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
//                 // Add password complexity validation here if needed
//                 await registerAndSendEmailOtpApi(formData);
//                 setStep(2);
//             }
//         } catch (err) {
//             setError(err.response?.data?.msg || 'An error occurred.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleVerify = async () => {
//         const identifier = isMobileSignup ? formData.mobileNumber : formData.email;
//         if (!otp) return setError('Please enter the OTP.');
//         setError(''); setIsLoading(true);
//         try {
//             const { data } = await verifyOtpApi({ identifier, otp });
//             const success = await loginWithToken(data.token, data.user);
//             if (success) {
//                 navigate(data.user.isVerified ? '/' : '/complete-profile');
//             }
//         } catch (err) {
//             setError(err.response?.data?.msg || 'Verification failed.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <Container component="main" maxWidth="xs" sx={{ mt: 8 }}>
//             <Paper elevation={3} sx={{ p: 4 }}>
//                 <Typography component="h1" variant="h5" align="center">Create Your Account</Typography>
//                 {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
//                 {step === 1 ? (
//                     <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
//                         <TextField margin="normal" required fullWidth label="Full Name" name="name" onChange={handleChange} />
//                         <DatePicker label="Date of Birth" disableFuture onChange={handleDateChange} slotProps={{ textField: { fullWidth: true, required: true, margin: "normal" } }}/>
//                         <TextField margin="normal" required={isMobileSignup} fullWidth label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} disabled={isMobileSignup} />
//                         <TextField margin="normal" required={!isMobileSignup} fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} disabled={!isMobileSignup} />
//                         {!isMobileSignup && (
//                             <>
//                                 <TextField margin="normal" required fullWidth label="Password (8+ characters, complex)" name="password" type="password" onChange={handleChange} />
//                                 <TextField margin="normal" required fullWidth label="Confirm Password" name="confirmPassword" type="password" onChange={handleChange} />
//                             </>
//                         )}
//                         <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2 }} disabled={isLoading}>
//                             {isLoading ? <CircularProgress size={24} /> : 'Continue'}
//                         </Button>
//                     </Box>
//                 ) : (
//                     <Box sx={{ mt: 1 }}>
//                         <Typography sx={{ my: 2 }} align="center">An OTP was sent to {isMobileSignup ? formData.mobileNumber : formData.email}.</Typography>
//                         <TextField margin="normal" required fullWidth label="6-Digit OTP" value={otp} onChange={e => setOtp(e.target.value)} />
//                         <Button fullWidth variant="contained" color="error" sx={{ mt: 2 }} disabled={isLoading} onClick={handleVerify}>Verify & Create Account</Button>
//                     </Box>
//                 )}
//             </Paper>
//         </Container>
//     );
// };

// export default RegisterPage;









// client/src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert, Link, CircularProgress, Paper, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user', organizationName: '' });
    const [pageError, setPageError] = useState('');
    const { register, isLoading, authError, setAuthError } = useAuth();
    const navigate = useNavigate();
    const isOrganizer = formData.role === 'organizer';

    useEffect(() => {
        return () => setAuthError(null);
    }, [setAuthError]);

    const handleChange = (e) => {
        setAuthError(null);
        setPageError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPageError(''); setAuthError(null);
        if (formData.password !== formData.confirmPassword) return setPageError("Passwords do not match.");
        if (formData.password.length < 6) return setPageError("Password must be at least 6 characters.");
        if (isOrganizer && !formData.organizationName.trim()) return setPageError("Organization name is required.");
        
        const result = await register(formData);
        if (result.success) {
            if (formData.role === 'organizer' && !result.isApproved) {
                alert("Registration successful! Your organizer account requires admin approval.");
                navigate('/login');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" gutterBottom>Register</Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    {authError && <Alert severity="error" sx={{ mb: 2 }}>{authError}</Alert>}
                    {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}
                    <TextField margin="normal" required fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
                    <TextField margin="normal" required fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
                    <TextField margin="normal" required fullWidth name="password" label="Password (min 6 chars)" type="password" value={formData.password} onChange={handleChange} disabled={isLoading} />
                    <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />
                    <FormControl component="fieldset" sx={{ mt: 2, mb: 1 }}>
                        <FormLabel component="legend">Register As</FormLabel>
                        <RadioGroup row name="role" value={formData.role} onChange={handleChange}>
                            <FormControlLabel value="user" control={<Radio size="small"/>} label="User" disabled={isLoading}/>
                            <FormControlLabel value="organizer" control={<Radio size="small"/>} label="Organizer" disabled={isLoading}/>
                        </RadioGroup>
                    </FormControl>
                    {isOrganizer && ( <TextField margin="normal" required={isOrganizer} fullWidth name="organizationName" label="Organization Name" value={formData.organizationName} onChange={handleChange} disabled={isLoading} sx={{ mb: 2 }}/> )}
                    <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2, mb: 2 }} disabled={isLoading}>
                       {isLoading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                     <Box sx={{ textAlign: 'center' }}> <Link component={RouterLink} to="/login" variant="body2" color="error"> {"Already have an account? Sign In"} </Link> </Box>
                </Box>
            </Paper>
        </Container>
    );
};
export default RegisterPage;