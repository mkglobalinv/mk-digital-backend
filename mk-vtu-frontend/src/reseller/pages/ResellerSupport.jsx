import React from 'react';
import { Headphones, MessageCircle, Mail, Phone, HelpCircle, ArrowRight } from 'lucide-react';
import './ResellerDashboard.css';

const ResellerSupport = () => {
    const supportOptions = [
        {
            title: "Priority WhatsApp Support",
            desc: "Direct line for Reseller owners & Website partners.",
            icon: <MessageCircle size={24} color="#25D366" />,
            link: "https://wa.me/2349041050812",
            action: "Chat Now"
        },
        {
            title: "Website Email",
            desc: "For technical issues, domain setups, and bulk inquiries.",
            icon: <Mail size={24} color="#3b82f6" />,
            link: "mailto:support@9jasub.com",
            action: "Send Email"
        },
        {
            title: "Call Website Desk",
            desc: "Available Mon-Fri, 9am - 5pm for critical issues.",
            icon: <Phone size={24} color="#8b5cf6" />,
            link: "tel:+2349041050812",
            action: "Call Now"
        }
    ];

    return (
        <div className="reseller-container">
            <header className="reseller-header">
                <h1>Website Support Center</h1>
                <p>Get priority assistance for your website and platform management</p>
            </header>

            <div className="support-intro-card" style={{ 
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', 
                color: 'white', 
                padding: '30px', 
                borderRadius: '20px', 
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px' }}>
                    <Headphones size={40} />
                </div>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '26.4px' }}>How can we help your brand today?</h2>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '16.5px' }}>As a Website Owner, you have access to priority support channels.</p>
                </div>
            </div>

            <div className="reseller-form-card" style={{ padding: '0' }}>
                <div className="support-list">
                    {supportOptions.map((opt, i) => (
                        <a key={i} href={opt.link} target="_blank" rel="noopener noreferrer" style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '20px', 
                            padding: '24px', 
                            borderBottom: i === supportOptions.length - 1 ? 'none' : '1px solid #f1f5f9',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'background 0.2s'
                        }} className="support-item-hover">
                            <div style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '12px', 
                                background: '#f8fafc', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                            }}>
                                {opt.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '17.6px', fontWeight: 700 }}>{opt.title}</h4>
                                <p style={{ margin: 0, fontSize: '14.3px', color: '#64748b' }}>{opt.desc}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--reseller-primary)', fontWeight: 600, fontSize: '15.4px' }}>
                                {opt.action} <ArrowRight size={16} />
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15.4px' }}>
                    <HelpCircle size={18} />
                    <span>Frequently asked questions and guides coming soon.</span>
                </div>
            </div>
        </div>
    );
};

export default ResellerSupport;
