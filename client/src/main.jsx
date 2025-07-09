// client/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// --- MUI Date Picker Imports ---
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs' // Using dayjs adapter
// --- End Date Picker Imports ---

// Remove Bootstrap CSS if not needed:
// import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Wrap with LocalizationProvider for MUI Date Pickers */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <App />
          </AuthProvider>
      </LocalizationProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
