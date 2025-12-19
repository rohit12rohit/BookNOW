// client/src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
// IMPORT FIX: This named import now works because we exported 'AuthContext' above
import { AuthContext } from '../contexts/AuthContext'; 
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

// Ensure this matches your backend URL
const API_URL = 'http://localhost:5001/api/auth'; 

const LoginPage = () => {
    const { login } = useContext(AuthContext); // Consuming the named export
    const navigate = useNavigate();
    const location = useLocation();

    // Steps: 'credentials' | 'otp'
    const [step, setStep] = useState('credentials');
    const [formData, setFormData] = useState({ email: '', password: '', otp: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const { email, password, otp } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Step 1: Submit Credentials
    const onCredentialSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            if (res.data.success && res.data.step === 'otp') {
                setMsg(res.data.msg); 
                setStep('otp');
            }
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.msg || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Submit OTP
    const onOtpSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/verify-login`, { email, otp });
            
            // Login successful
            login(res.data.token, res.data.role);
            
            // Redirect based on role or previous location
            const from = location.state?.from?.pathname || '/dashboard';
            if (res.data.role === 'admin') navigate('/admin');
            else if (res.data.role === 'organizer') navigate('/organizer');
            else navigate(from);

        } catch (err) {
            setError(err.response?.data?.msg || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.open('http://localhost:5001/api/auth/google', '_self');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{step === 'credentials' ? 'Login' : 'Enter OTP'}</h2>
                {error && <div className="alert error">{error}</div>}
                {msg && <div className="alert success">{msg}</div>}

                {step === 'credentials' ? (
                    <form onSubmit={onCredentialSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={email} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={password} onChange={onChange} required />
                        </div>
                        <button type="submit" className="btn-primary block" disabled={loading}>
                            {loading ? 'Processing...' : 'Login'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onOtpSubmit}>
                        <div className="form-group">
                            <label>One-Time Password (OTP)</label>
                            <input 
                                type="text" 
                                name="otp" 
                                value={otp} 
                                onChange={onChange} 
                                placeholder="Enter 6-digit OTP"
                                maxLength="6"
                                required 
                            />
                        </div>
                        <button type="submit" className="btn-primary block" disabled={loading}>
                            {loading ? 'Verify & Login' : 'Verify'}
                        </button>
                        <p className="text-center mt-2">
                            <button type="button" className="btn-text" onClick={() => setStep('credentials')}>
                                Back to Login
                            </button>
                        </p>
                    </form>
                )}

                {step === 'credentials' && (
                    <>
                        <div className="divider"><span>OR</span></div>
                        <button onClick={handleGoogleLogin} className="btn-google block">
                            Continue with Google
                        </button>
                        <p className="auth-footer">
                            Don't have an account? <Link to="/register">Register</Link>
                        </p>
                        <p className="auth-footer">
                            <Link to="/forgotpassword">Forgot Password?</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;