// client/src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';


// Layouts
import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';

// Eagerly loaded core pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Wrapper
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load other pages
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const OrganizerDashboardPage = lazy(() => import('./pages/OrganizerDashboardPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const WriteReviewPage = lazy(() => import('./pages/WriteReviewPage')); // New page for reviews


// Organizer-specific pages
const OrganizerVenueFormPage = lazy(() => import('./pages/organizer/OrganizerVenueFormPage'));
const OrganizerShowtimeFormPage = lazy(() => import('./pages/organizer/OrganizerShowtimeFormPage'));
const OrganizerEventFormPage = lazy(() => import('./pages/organizer/OrganizerEventFormPage'));


// Admin-specific pages
const UserDetailsPage = lazy(() => import('./pages/admin/UserDetailsPage'));

// Placeholder for UserProfilePage
const UserProfilePage = lazy(() => {
    return Promise.resolve({ default: () => <Box p={3} textAlign="center"><Typography>User Profile Page (Coming Soon)</Typography></Box> });
});


// Fallback UI for Suspense
const PageLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 128px)', p:3 }}>
        <CircularProgress color="error" />
    </Box>
);

function App() {
  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, py: {xs: 1, sm: 2, md:3} }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* --- Public Routes --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/resetpassword/:resettoken" element={<ResetPasswordPage />} />
              <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/book/:showtimeId" element={<BookingPage />} />


              {/* --- Protected Routes (Require Basic Login) --- */}
              <Route
                  path="/my-bookings"
                  element={ <ProtectedRoute> <MyBookingsPage /> </ProtectedRoute> }
              />
              <Route
                  path="/booking-confirmation/:bookingId"
                  element={ <ProtectedRoute> <BookingConfirmationPage /> </ProtectedRoute> }
              />
              <Route
                  path="/profile"
                  element={ <ProtectedRoute> <UserProfilePage /> </ProtectedRoute> }
              />
               <Route
                  path="/movies/:movieId/review"
                  element={ <ProtectedRoute> <WriteReviewPage /> </ProtectedRoute> }
              />

              {/* --- Organizer Routes --- */}
              <Route
                  path="/organizer" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerDashboardPage /> </ProtectedRoute> }
              />
                <Route
                  path="/organizer/events/new"
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerEventFormPage mode="create" /> </ProtectedRoute> }
              />
              <Route
                  path="/organizer/events/edit/:eventId"
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerEventFormPage mode="edit" /> </ProtectedRoute> }
              />
              <Route 
                  path="/organizer/venues/new" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerVenueFormPage mode="create" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/venues/edit/:venueId" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerVenueFormPage mode="edit" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/showtimes/new" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerShowtimeFormPage mode="create" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/showtimes/edit/:showtimeId" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerShowtimeFormPage mode="edit" /> </ProtectedRoute> } 
              />
               <Route
                  path="/organizer/*" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerDashboardPage /> </ProtectedRoute> }
              />

              {/* --- Admin Routes --- */}
              <Route
                  path="/admin" 
                  element={ <ProtectedRoute allowedRoles={['admin']}> <AdminDashboardPage /> </ProtectedRoute> }
              />
               <Route
                  path="/admin/users/:userId"
                  element={ <ProtectedRoute allowedRoles={['admin']}> <UserDetailsPage /> </ProtectedRoute> }
              />
              <Route
                  path="/admin/*" 
                  element={ <ProtectedRoute allowedRoles={['admin']}> <AdminDashboardPage /> </ProtectedRoute> }
              />
              
              {/* --- Not Found --- */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Box>
        <Footer />
      </Box>
    </>
  );
}

export default App;