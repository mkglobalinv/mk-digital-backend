import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ReferralCenter from './pages/ReferralCenter.jsx';
import './index.css';

const dummyUser = { earningsBalance: 15500 };
const dummyAnalytics = { totalReferrals: 12, activatedReferrals: 8, activationRewardsEarned: 16000, lifetimeReferralEarnings: 450, totalReferralIncome: 16450 };
const dummyHistory = [
    { id: 1, name: 'Alice Smith', date: new Date().toISOString(), activationStatus: 'Activated' },
    { id: 2, name: 'Bob Jones', date: new Date().toISOString(), activationStatus: 'Pending' }
];

const App = () => {
    // Mock the API inside the component since it fires on mount
    return (
        <BrowserRouter>
            <ReferralCenter user={dummyUser} siteInfo={{ branding: { siteName: 'MKSUBDATA' } }} />
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
