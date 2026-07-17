import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import API from "../../api";
import { PhoneCall, MessageCircle, MapPin, Users, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import './ResellerBusinessProfile.css';

const ResellerBusinessProfile = ({ user }) => {
    const [profile, setProfile] = useState({
        businessName: user?.branding?.siteName || user?.onboardingData?.businessName || 'My Business',
        tier: user?.resellerTier || 'basic',
        whatsapp: user?.branding?.whatsappNumber || user?.onboardingData?.whatsapp || '',
        verifiedContact: user?.kycData?.phone || user?.onboardingData?.whatsapp || '',
        supportAvailability: user?.branding?.supportAvailability || 'Mon-Fri 9AM-5PM',
        totalCustomers: 0,
        totalProfit: user?.profitBalance || 0,
        totalTransactions: 0
    });

    useEffect(() => {
        if (!user?._id) return;
        fetchStats();

        // Supabase real-time sync for branding changes
        const channel = supabase
            .channel(`reseller_branding_${user._id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reseller_branding',
                    filter: `user_id=eq.${user._id}`
                },
                (payload) => {
                    const data = payload.new;
                    setProfile(prev => ({
                        ...prev,
                        businessName: data.site_name || prev.businessName,
                        whatsapp: data.whatsapp_number || prev.whatsapp,
                        supportAvailability: data.support_availability || prev.supportAvailability,
                        tier: data.reseller_tier || prev.tier,
                        verifiedContact: data.verified_contact || prev.verifiedContact
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await API.get('/api/reseller/analytics'); // Assuming analytics endpoint exists
            if (res.data) {
                setProfile(prev => ({
                    ...prev,
                    totalCustomers: res.data.totalCustomers || 0,
                    totalTransactions: res.data.totalTransactions || 0,
                    totalProfit: res.data.totalProfit || prev.totalProfit
                }));
            }
        } catch (err) {
            console.error('Failed to fetch analytics for profile', err);
        }
    };

    const handleWhatsApp = () => {
        if (!profile.whatsapp) return;
        const formatted = profile.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${formatted}`, '_blank');
    };

    const handleCall = () => {
        if (!profile.verifiedContact) return;
        window.location.href = `tel:${profile.verifiedContact}`;
    };

    return (
        <div className="reseller-business-profile">
            <div className="profile-header">
                <div className="profile-identity">
                    <div className="profile-avatar">
                        {profile.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h3>{profile.businessName} <ShieldCheck size={16} className="verified-badge" /></h3>
                        <span className={`tier-badge tier-${profile.tier}`}>
                            {profile.tier.toUpperCase()} RESELLER
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="profile-contact-actions">
                <button className="contact-btn whatsapp-btn" onClick={handleWhatsApp} disabled={!profile.whatsapp}>
                    <MessageCircle size={18} /> WhatsApp Support
                </button>
                <button className="contact-btn call-btn" onClick={handleCall} disabled={!profile.verifiedContact}>
                    <PhoneCall size={18} /> Direct Call
                </button>
            </div>

            <div className="profile-details-grid">
                <div className="detail-item">
                    <span className="detail-label"><Activity size={14} /> Support Hours</span>
                    <span className="detail-value">{profile.supportAvailability}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label"><Users size={14} /> Total Customers</span>
                    <span className="detail-value">{profile.totalCustomers.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label"><TrendingUp size={14} /> Total Profit</span>
                    <span className="detail-value profit-value">₦{profile.totalProfit.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label"><MapPin size={14} /> Verified Number</span>
                    <span className="detail-value">{profile.verifiedContact || 'Pending'}</span>
                </div>
            </div>
        </div>
    );
};

export default ResellerBusinessProfile;
