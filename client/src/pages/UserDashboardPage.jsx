// client/src/pages/UserDashboardPage.jsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography, Box, Paper, Tabs, Tab } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import RateReviewIcon from '@mui/icons-material/RateReview';

// Import the new section components
import ProfileSection from '../components/user/ProfileSection';
import MyBookingsSection from '../components/user/MyBookingsSection';
import MyReviewsSection from '../components/user/MyReviewsSection';

// TabPanel helper component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`user-dashboard-tabpanel-${index}`}
            aria-labelledby={`user-dashboard-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3, pb: 3, px: { xs: 1, sm: 2 } }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `user-dashboard-tab-${index}`,
        'aria-controls': `user-dashboard-tabpanel-${index}`,
    };
}

const UserDashboardPage = () => {
    const location = useLocation();

    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        const tabMap = { 'profile': 0, 'bookings': 1, 'reviews': 2 };
        return tabMap[tabParam] || 0;
    };

    const [currentTab, setCurrentTab] = useState(getInitialTab());

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: { xs: 'center', sm: 'left' }, mb: 3 }}>
                My Account
            </Typography>

            <Paper elevation={3} sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        aria-label="User dashboard tabs"
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" {...a11yProps(0)} />
                        <Tab icon={<ConfirmationNumberIcon />} iconPosition="start" label="My Bookings" {...a11yProps(1)} />
                        <Tab icon={<RateReviewIcon />} iconPosition="start" label="My Reviews" {...a11yProps(2)} />
                    </Tabs>
                </Box>

                <TabPanel value={currentTab} index={0}>
                    <ProfileSection />
                </TabPanel>
                <TabPanel value={currentTab} index={1}>
                    <MyBookingsSection />
                </TabPanel>
                <TabPanel value={currentTab} index={2}>
                    <MyReviewsSection />
                </TabPanel>
            </Paper>
        </Container>
    );
};

export default UserDashboardPage;