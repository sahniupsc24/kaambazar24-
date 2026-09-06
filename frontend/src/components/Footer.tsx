import { Link } from 'react-router-dom';

const WHATSAPP_NUMBER = '919935173572';

export function Footer() {
  return (
    <footer
      style={{
        background: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b',
        padding: '48px 32px 24px 32px',
        marginTop: 64,
        fontSize: 14,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 36,
          paddingBottom: 40,
          borderBottom: '1px solid #1e293b',
        }}
      >
        {/* Col 1: About */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0d9488', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🧰
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>Kaam Bazar</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8', marginBottom: 16 }}>
            भारत का भरोसेमंद कामगार एवं रोज़गार पोर्टल। प्लंबर, इलेक्ट्रिशियन, निर्माण मजदूर, ड्राइवर और घरेलू सहायकों के लिए सीधी भर्ती।
          </p>
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            📞 Helpdesk: <strong>+91 99351 73572</strong>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            <li><Link to="/jobs" style={{ color: '#94a3b8', textDecoration: 'none' }}>🔍 Find Blue-Collar Jobs</Link></li>
            <li><Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>👷 Register as Worker</Link></li>
            <li><Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>🏢 Post a Job (Employers)</Link></li>
            <li><Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>🔑 Account Login</Link></li>
          </ul>
        </div>

        {/* Col 3: Popular Categories */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Popular Categories</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            <li><Link to="/jobs?category=construction-building" style={{ color: '#94a3b8', textDecoration: 'none' }}>🧱 Construction (निर्माण)</Link></li>
            <li><Link to="/jobs?category=plumbing" style={{ color: '#94a3b8', textDecoration: 'none' }}>🚰 Plumbing (प्लंबिंग)</Link></li>
            <li><Link to="/jobs?category=electrical-work" style={{ color: '#94a3b8', textDecoration: 'none' }}>⚡ Electrical (इलेक्ट्रिकल)</Link></li>
            <li><Link to="/jobs?category=painting-decorating" style={{ color: '#94a3b8', textDecoration: 'none' }}>🎨 Painting (पेंटिंग)</Link></li>
            <li><Link to="/jobs?category=driving" style={{ color: '#94a3b8', textDecoration: 'none' }}>🚗 Driver (ड्राइवर)</Link></li>
          </ul>
        </div>

        {/* Col 4: Support & Legal */}
        <div>
          <h4 style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Support & Legal</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            <li><Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none' }}>ℹ️ About Us</Link></li>
            <li><Link to="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>📞 Contact Us</Link></li>
            <li><Link to="/privacy-policy" style={{ color: '#94a3b8', textDecoration: 'none' }}>🔒 Privacy Policy</Link></li>
            <li><Link to="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>📜 Terms & Conditions</Link></li>
          </ul>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '20px auto 0 auto', textAlign: 'center', fontSize: 13, color: '#64748b' }}>
        © {new Date().getFullYear()} Kaam Bazar (काम बाज़ार). All rights reserved. Built for Workforce & Blue-Collar Empowerment in India.
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(37, 211, 102, 0.4)',
          zIndex: 990,
          textDecoration: 'none',
          transition: 'transform 0.2s ease',
        }}
      >
        <svg viewBox="0 0 32 32" width="30" height="30" fill="#fff">
          <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.693 4.612 1.885 6.487L4 29l7.702-1.86A11.94 11.94 0 0 0 16.001 27C22.628 27 28 21.627 28 15S22.628 3 16.001 3Zm0 21.6a9.55 9.55 0 0 1-4.87-1.34l-.35-.207-4.573 1.104 1.128-4.463-.228-.365A9.56 9.56 0 0 1 6.4 15c0-5.294 4.307-9.6 9.601-9.6 5.293 0 9.6 4.306 9.6 9.6 0 5.293-4.307 9.6-9.6 9.6Zm5.267-7.19c-.288-.144-1.706-.842-1.97-.938-.264-.096-.456-.144-.648.144-.192.288-.744.938-.912 1.13-.168.192-.336.216-.624.072-.288-.144-1.216-.448-2.316-1.428-.856-.763-1.434-1.706-1.602-1.994-.168-.288-.018-.444.126-.588.13-.129.288-.336.432-.504.144-.168.192-.288.288-.48.096-.192.048-.36-.024-.504-.072-.144-.648-1.562-.888-2.14-.234-.562-.472-.486-.648-.495l-.552-.01c-.192 0-.504.072-.768.36-.264.288-1.008.985-1.008 2.404 0 1.419 1.032 2.789 1.176 2.981.144.192 2.03 3.1 4.918 4.347.687.297 1.223.474 1.641.606.689.219 1.316.188 1.812.114.553-.083 1.706-.698 1.947-1.372.24-.674.24-1.252.168-1.372-.072-.12-.264-.192-.552-.336Z"/>
        </svg>
      </a>
    </footer>
  );
}
