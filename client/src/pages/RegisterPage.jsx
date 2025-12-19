import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const API_URL = 'http://localhost:5001/api/auth';

const RegisterPage = () => {
    const navigate = useNavigate();
    
    const [step, setStep] = useState('details'); // 'details' | 'otp'
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '', role: 'user', organizationName: '', otp: ''
    });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password, confirmPassword, role, organizationName, otp } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Step 1: Submit Details
    const onDetailsSubmit = async e => {
        e.preventDefault();
        if (password !== confirmPassword) return setError('Passwords do not match');
        
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/register`, {
                name, email, password, role,
                organizationName: role === 'organizer' ? organizationName : undefined
            });
            if (res.data.success) {
                setMsg(res.data.msg);
                setStep('otp');
            }
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.msg || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const onOtpSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/verify-signup`, { email, otp });
            // On success, redirect to login so they can login (or auto-login if you prefer)
            // Here we redirect to Login to confirm the flow
            navigate('/login'); 
            alert('Account verified! Please login.');
        } catch (err) {
            setError(err.response?.data?.msg || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{step === 'details' ? 'Create Account' : 'Verify Email'}</h2>
                {error && <div className="alert error">{error}</div>}
                {msg && <div className="alert success">{msg}</div>}

                {step === 'details' ? (
                    <form onSubmit={onDetailsSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" name="name" value={name} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={email} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select name="role" value={role} onChange={onChange}>
                                <option value="user">User</option>
                                <option value="organizer">Organizer</option>
                            </select>
                        </div>
                        {role === 'organizer' && (
                            <div className="form-group">
                                <label>Organization Name</label>
                                <input type="text" name="organizationName" value={organizationName} onChange={onChange} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={password} onChange={onChange} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" name="confirmPassword" value={confirmPassword} onChange={onChange} required />
                        </div>
                        <button type="submit" className="btn-primary block" disabled={loading}>
                            {loading ? 'Processing...' : 'Register'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onOtpSubmit}>
                        <div className="form-group">
                            <label>Enter OTP sent to {email}</label>
                            <input type="text" name="otp" value={otp} onChange={onChange} maxLength="6" required />
                        </div>
                        <button type="submit" className="btn-primary block" disabled={loading}>
                            Verify Account
                        </button>
                    </form>
                )}

                {step === 'details' && (
                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;