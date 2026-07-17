import React from 'react';
import { Headphones, Mail, MessageCircle, Phone, Globe, ExternalLink } from 'lucide-react';
import './Support.css';

const Support = ({ siteInfo }) => {
  const branding = siteInfo?.branding || {};
  const supportWhatsapp = branding.whatsappNumber || "2349041050812";
  const supportEmail = branding.contactEmail || "support@9jasub.com";
  const supportPhone = branding.whatsappNumber ? `+${branding.whatsappNumber}` : "+234 904 105 0812";

  const contactMethods = [
    {
      name: "WhatsApp Support",
      value: supportWhatsapp,
      icon: <MessageCircle />,
      link: `https://wa.me/${supportWhatsapp}`,
      desc: "Fastest response time"
    },
    {
      name: "Email Us",
      value: supportEmail,
      icon: <Mail />,
      link: `mailto:${supportEmail}`,
      desc: "Detailed inquiries"
    },
    {
      name: "Call Support",
      value: supportPhone,
      icon: <Phone />,
      link: `tel:${supportWhatsapp || "2349041050812"}`,
      desc: "Voice support available"
    },
    {
       name: "Community",
       value: "Join Group",
       icon: <Globe />,
       link: branding.telegramLink || "https://whatsapp.com/channel/0029Vb5WEwe8KMqr4K5bSS0d",
       desc: "Offers & platform updates"
    }
  ];

  return (
    <div className="page-container support-page premium-theme">
      <div className="support-header">
        <Headphones size={48} className="support-header-icon" />
        <h2>Customer Support</h2>
        <p>How can we help you today?</p>
      </div>

      <div className="support-content">
        <div className="support-grid">
          {contactMethods.map((method, idx) => (
            <a key={idx} href={method.link} target="_blank" rel="noopener noreferrer" className="support-card">
              <div className="method-icon">
                {method.icon}
              </div>
              <div className="method-info">
                <h4>{method.name}</h4>
                <p className="method-value">{method.value}</p>
                <p className="method-desc">{method.desc}</p>
              </div>
              <ExternalLink size={16} className="ext-link" />
            </a>
          ))}
        </div>

        <div className="support-footer-info">
           <p>Our dedicated team is ready to assist you with any transaction issues or service inquiries.</p>
           <p className="branding-text">© {branding.siteName || "9JASUB"} Powered by MK GLOBAL INVESTMENT LTD.</p>
        </div>
      </div>
    </div>
  );
};

export default Support;
