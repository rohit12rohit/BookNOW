// // client/src/pages/LoginPage.jsx
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { useNavigate, Link as RouterLink } from 'react-router-dom';
// import { sendLoginOtpApi, verifyLoginOtpApi } from '../api/auth';
// import { Container, Box, TextField, Button, Typography, Alert, Link, CircularProgress, Paper, Tabs, Tab } from '@mui/material';

// // Email Login Component
// const EmailLogin = () => {
//     const [formData, setFormData] = useState({ email: '', password: '' });
//     const { login, isLoading, authError, setAuthError } = useAuth();
//     const navigate = useNavigate();

//     useEffect(() => {
//         setAuthError(null);
//         return () => setAuthError(null);
//     }, [setAuthError]);

//     const handleChange = (e) => {
//         setAuthError(null);
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const success = await login(formData);
//         if (success) {
//             navigate('/');
//         }
//     };

//     return (
//         <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
//             {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}
//             <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} disabled={isLoading} />
//             <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={formData.password} onChange={handleChange} disabled={isLoading} />
//             <Box sx={{ textAlign: 'right', my: 1 }}><Link component={RouterLink} to="/forgot-password" variant="body2" color="error">Forgot password?</Link></Box>
//             <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
//                 {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
//             </Button>
//         </Box>
//     );
// };

// // Mobile OTP Login Component
// const MobileLogin = () => {
//     const [step, setStep] = useState(1); // 1 for mobile input, 2 for OTP input
//     const [mobileNumber, setMobileNumber] = useState('');
//     const [otp, setOtp] = useState('');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [isResendDisabled, setIsResendDisabled] = useState(false);
//     const [countdown, setCountdown] = useState(0);
//     const { loginWithToken } = useAuth(); // Assume AuthContext provides this function
//     const navigate = useNavigate();

//     useEffect(() => {
//         let timer;
//         if (countdown > 0) {
//             timer = setTimeout(() => setCountdown(countdown - 1), 1000);
//         } else {
//             setIsResendDisabled(false);
//         }
//         return () => clearTimeout(timer);
//     }, [countdown]);
    
//     const startResendTimer = () => {
//         setIsResendDisabled(true);
//         setCountdown(30);
//     };

//     const handleSendOtp = async () => {
//         if (!/^[0-9]{10}$/.test(mobileNumber)) return setError("Please enter a valid 10-digit mobile number.");
//         setError('');
//         setIsLoading(true);
//         try {
//             await sendLoginOtpApi(mobileNumber);
//             setStep(2);
//             startResendTimer();
//         } catch (err) {
//             setError(err.msg || err.message || 'Failed to send OTP.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleVerifyOtp = async () => {
//         if (!/^[0-9]{6}$/.test(otp)) return setError("Please enter the 6-digit OTP.");
//         setError('');
//         setIsLoading(true);
//         try {
//             // We need a way to log in with the token received from the OTP verification
//             // Let's modify the AuthContext to handle this. For now, we'll assume it exists.
//             const response = await verifyLoginOtpApi(mobileNumber, otp);
//             await loginWithToken(response.token); // This function needs to be added to AuthContext
//             navigate('/');
//         } catch (err) {
//             setError(err.response?.data?.errors?.[0]?.msg || err.message || 'OTP Verification failed.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <Box sx={{ mt: 1 }}>
//             {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
//             {step === 1 ? (
//                 <>
//                     <TextField margin="normal" required fullWidth id="mobileNumber" label="10-Digit Mobile Number" name="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} disabled={isLoading} />
//                     <Button onClick={handleSendOtp} fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
//                         {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
//                     </Button>
//                 </>
//             ) : (
//                 <>
//                     <Typography variant="body2" sx={{ textAlign: 'center', mb: 2 }}>Enter the 6-digit OTP sent to {mobileNumber}.</Typography>
//                     <TextField margin="normal" required fullWidth id="otp" label="OTP" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isLoading} />
//                     <Button onClick={handleVerifyOtp} fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
//                         {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Login'}
//                     </Button>
//                     <Box sx={{ textAlign: 'center' }}>
//                         <Button onClick={handleSendOtp} disabled={isResendDisabled} size="small">
//                             {isResendDisabled ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
//                         </Button>
//                     </Box>
//                 </>
//             )}
//         </Box>
//     );
// };

// // Main LoginPage Component with Tabs
// const LoginPage = () => {
//     const [tabIndex, setTabIndex] = useState(0);

//     const handleTabChange = (event, newValue) => {
//         setTabIndex(newValue);
//     };

//     return (
//         <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
//             <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                 <Typography component="h1" variant="h5" gutterBottom>Login</Typography>
//                 <Box sx={{ width: '100%' }}>
//                     <Tabs value={tabIndex} onChange={handleTabChange} centered indicatorColor="primary" textColor="primary">
//                         <Tab label="Email" />
//                         <Tab label="Mobile" />
//                     </Tabs>
//                 </Box>
//                 {tabIndex === 0 && <EmailLogin />}
//                 {tabIndex === 1 && <MobileLogin />}
//                 <Box sx={{ textAlign: 'center', mt: 2 }}>
//                     <Link component={RouterLink} to="/register" variant="body2" color="error">
//                         {"Don't have an account? Sign Up"}
//                     </Link>
//                 </Box>
//             </Paper>
//         </Container>
//     );
// };

// export default LoginPage;







// // client/src/pages/LoginPage.jsx
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { checkUserApi } from '../api/auth';
// import { GoogleLogin } from '@react-oauth/google';
// import { Container, Box, TextField, Button, Typography, Alert, CircularProgress, Paper, Divider } from '@mui/material';

// const LoginPage = () => {
//     const [identifier, setIdentifier] = useState('');
//     const [password, setPassword] = useState('');
//     const [step, setStep] = useState('identifier');
//     const [error, setError] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const { login, googleLogin } = useAuth();
//     const navigate = useNavigate();

//     const handleContinue = async () => {
//         if (!identifier.trim()) return setError('Please enter your email or mobile number.');
//         setError(''); setIsLoading(true);
//         try {
//             const { data } = await checkUserApi(identifier);
//             if (data.exists) {
//                 if (data.method === 'password') setStep('password');
//                 else navigate('/otp', { state: { identifier } });
//             } else {
//                 if (data.method === 'new-email-signup') navigate('/register', { state: { email: identifier } });
//                 else navigate('/register', { state: { mobile: identifier } });
//             }
//         } catch (err) { setError(err.response?.data?.msg || 'An error occurred.'); } 
//         finally { setIsLoading(false); }
//     };
    
//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setError(''); setIsLoading(true);
//         try {
//             await login({ email: identifier, password });
//             navigate('/');
//         } catch(err) {
//             setError(err.response?.data?.msg || 'Invalid credentials.');
//         } finally { setIsLoading(false); }
//     };

//     const handleGoogleSuccess = async (credentialResponse) => {
//         setIsLoading(true);
//         const success = await googleLogin(credentialResponse.credential);
//         if (success) navigate('/');
//         else setError('Google Sign-In failed.');
//         setIsLoading(false);
//     };

//     return (
//         <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
//             <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//                 <Typography component="h1" variant="h5">Sign In or Sign Up</Typography>
//                 {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                
//                 {step === 'identifier' && (
//                     <Box sx={{ mt: 1, width: '100%' }}>
//                         <TextField margin="normal" required fullWidth label="Email or Mobile Number" value={identifier} onChange={e => setIdentifier(e.target.value)} autoFocus />
//                         <Button fullWidth variant="contained" color="error" sx={{ mt: 2, mb: 2 }} disabled={isLoading} onClick={handleContinue}>
//                             {isLoading ? <CircularProgress size={24} /> : 'Continue'}
//                         </Button>
//                         <Divider sx={{ my: 2 }}>OR</Divider>
//                         <Box sx={{ display: 'flex', justifyContent: 'center' }}>
//                             <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Sign-In failed.')} />
//                         </Box>
//                     </Box>
//                 )}

//                 {step === 'password' && (
//                     <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
//                         <Typography sx={{my: 2}}>Enter your password for {identifier}</Typography>
//                         <TextField margin="normal" required fullWidth name="password" label="Password" type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} />
//                         <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 2 }} disabled={isLoading}>
//                             {isLoading ? <CircularProgress size={24} /> : 'Login'}
//                         </Button>
//                          <Button fullWidth variant="text" size="small" sx={{ mt: 1 }} onClick={() => setStep('identifier')}>Use another account</Button>
//                     </Box>
//                 )}
//             </Paper>
//         </Container>
//     );
// };

// export default LoginPage;






// client/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Alert, Link, CircularProgress, Paper } from '@mui/material';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login, isLoading, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
      return () => setAuthError(null);
  }, [setAuthError]);

  const handleChange = (e) => {
    setAuthError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(formData);
    if (success) {
      navigate('/');
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>Login</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          {authError && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{authError}</Alert>}
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} disabled={isLoading} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={formData.password} onChange={handleChange} disabled={isLoading} />
          <Box sx={{ textAlign: 'right', my: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" color="error">Forgot password?</Link>
          </Box>
          <Button type="submit" fullWidth variant="contained" color="error" sx={{ mt: 3, mb: 2 }} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
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