// client/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// --- MUI Date Picker Imports ---
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs' // Using dayjs adapter

// --- End Date Picker Imports ---

// Remove Bootstrap CSS if not needed:
// import 'bootstrap/dist/css/bootstrap.min.css';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LocalizationProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
