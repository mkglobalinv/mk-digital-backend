import React, { useState, useEffect } from 'react';
import { CheckCircle, TrendingUp, Wallet, Lightbulb } from 'lucide-react';
import './ResellerWelcomeModal.css';

const ResellerWelcomeModal = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (document.cookie.includes('showWelcome=true')) {
            setIsOpen(true);
            const domain = window.location.hostname.includes('9jasub.com') ? '; domain=.9jasub.com' : '';
            document.cookie = `showWelcome=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}`;
        }
    }, []);

    const handleDismiss = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="reseller-welcome-overlay">
            <div className="reseller-welcome-modal">
                <div className="welcome-header">
                    <CheckCircle size={48} className="welcome-icon" />
                    <h2>🎉 Congratulations!</h2>
                    <h3>Your VTU Website Is Ready</h3>
                    <p>Your digital business has been created successfully.</p>
                </div>

                <div className="welcome-body">
                    <div className="welcome-section">
                        <h4><TrendingUp size={20} /> 🚀 Start Selling Immediately</h4>
                        <p>One of the biggest advantages of your website is that <strong>you do not need to deposit money or invest capital before you start selling digital services.</strong></p>
                        <p>Your customers will:</p>
                        <ul>
                            <li>Register on your website.</li>
                            <li>Fund <strong>their own wallets</strong>.</li>
                            <li>Purchase digital services using <strong>their own wallet balances</strong>.</li>
                        </ul>
                        <p>Examples include: Data Bundles, Airtime, Electricity Bills, Cable TV, WAEC/ePINs, JAMB/ePINs, Result Checker PINs, Recharge Cards, and any future digital services supported by your platform.</p>
                    </div>

                    <div className="welcome-section">
                        <h4><Wallet size={20} /> 💰 How You Earn</h4>
                        <p>Every time your customer successfully purchases a service from your website:</p>
                        <ul>
                            <li>They pay using their own wallet.</li>
                            <li>The system processes the purchase automatically.</li>
                            <li>You earn the profit based on the selling prices you configured.</li>
                        </ul>
                        <p>No manual processing is required.</p>
                    </div>

                    <div className="welcome-section">
                        <h4><TrendingUp size={20} /> 📈 Grow Your Business</h4>
                        <p>To begin making sales:</p>
                        <ul>
                            <li>Share your website link.</li>
                            <li>Invite customers to register.</li>
                            <li>Promote your business on WhatsApp, Facebook, Instagram, TikTok, Telegram, and other social media.</li>
                            <li>Build your customer base and earn profit from every successful transaction.</li>
                        </ul>
                    </div>

                    <div className="welcome-section highlight-section">
                        <h4><Lightbulb size={20} /> 💡 Important Tip</h4>
                        <p>Your customers use <strong>their own funds</strong> to purchase services.</p>
                        <p>You only need to fund your <strong>Main Wallet (Operating Balance)</strong> when using optional platform features that specifically require payment, such as Premium subscriptions or other paid services.</p>
                    </div>
                </div>

                <div className="welcome-footer">
                    <button className="start-btn" onClick={handleDismiss}>Start Managing My Website</button>
                </div>
            </div>
        </div>
    );
};

export default ResellerWelcomeModal;
