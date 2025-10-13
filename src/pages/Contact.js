import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, User } from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! (This is a demo)');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '0 16px' : '0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FFC42D 0%, #FFD970 100%)',
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '32px 24px' : '48px',
        marginBottom: isMobile ? '24px' : '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: isMobile ? '200px' : '350px',
          height: isMobile ? '200px' : '350px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          top: isMobile ? '-80px' : '-150px',
          right: isMobile ? '-50px' : '-100px'
        }} />
        <div style={{
          position: 'absolute',
          width: isMobile ? '150px' : '250px',
          height: isMobile ? '150px' : '250px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: isMobile ? '-40px' : '-80px',
          right: isMobile ? '20px' : '100px'
        }} />
        {!isMobile && (
          <div style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '40px',
            right: '250px'
          }} />
        )}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: isMobile ? '28px' : '42px', 
            fontWeight: 900, 
            margin: '0 0 12px 0',
            color: '#000'
          }}>
            Contact Page
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: isMobile ? '14px' : '16px',
            color: '#000',
            opacity: 0.85,
            fontWeight: 500
          }}>
            We're here to help. Feel free to reach out to us
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: isMobile ? '24px' : '32px', 
        marginBottom: isMobile ? '24px' : '32px' 
      }}>
        {/* Contact Info Section */}
        <div>
          <h2 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 800, 
            margin: '0 0 20px 0',
            color: '#000'
          }}>
            Contact Us
          </h2>

          {/* Email Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '16px' : '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 196, 45, 0.3)';
              e.currentTarget.style.borderColor = '#FFC42D';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '14px',
              background: '#FFC42D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Mail size={isMobile ? 24 : 28} color="white" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#999', fontWeight: 600, marginBottom: '4px' }}>EMAIL</div>
              <div style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 600, 
                color: '#2b2b2b',
                wordBreak: 'break-word'
              }}>
                pickaplate@gmail.com
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '16px' : '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 196, 45, 0.3)';
              e.currentTarget.style.borderColor = '#FFC42D';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '14px',
              background: '#FFC42D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Phone size={isMobile ? 24 : 28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#999', fontWeight: 600, marginBottom: '4px' }}>PHONE</div>
              <div style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#2b2b2b' }}>+1 234 567 7890</div>
            </div>
          </div>

          {/* Address Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '16px' : '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
            border: '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 196, 45, 0.3)';
              e.currentTarget.style.borderColor = '#FFC42D';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'transparent';
            }
          }}>
            <div style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '14px',
              background: '#FFC42D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={isMobile ? 24 : 28} color="white" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#999', fontWeight: 600, marginBottom: '4px' }}>ADDRESS</div>
              <div style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 600, 
                color: '#2b2b2b',
                wordBreak: 'break-word'
              }}>
                123 Main Street City, State 12345
              </div>
            </div>
          </div>

          {/* Business Hours Card */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF7DA 0%, #FFF3C4 100%)',
            borderRadius: '16px',
            padding: isMobile ? '20px' : '24px',
            border: '2px solid #FFC42D'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Clock size={isMobile ? 20 : 24} color="#FFC42D" />
              <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: 700, color: '#2b2b2b' }}>Business Hours</h3>
            </div>
            <div style={{ fontSize: isMobile ? '13px' : '14px', lineHeight: '1.8', color: '#666' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Monday - Friday:</span>
                <span>9:00 AM - 6:00 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Saturday:</span>
                <span>10:00 AM - 4:00 PM</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Sunday:</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 style={{ 
            fontSize: isMobile ? '20px' : '24px', 
            fontWeight: 800, 
            margin: '0 0 20px 0',
            color: '#000'
          }}>
            Send us a Message
          </h2>

          <form onSubmit={handleSubmit} style={{
            background: 'white',
            borderRadius: '16px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}>
            {/* Name Input */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: isMobile ? '13px' : '14px', 
                fontWeight: 600, 
                color: '#2b2b2b' 
              }}>
                Your Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#999" style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)' 
                }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px 12px 44px' : '14px 16px 14px 48px',
                    borderRadius: '12px',
                    border: '2px solid #e5e5e5',
                    fontSize: isMobile ? '14px' : '15px',
                    outline: 'none',
                    transition: 'border 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFC42D'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
            </div>

            {/* Email Input */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: isMobile ? '13px' : '14px', 
                fontWeight: 600, 
                color: '#2b2b2b' 
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#999" style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)' 
                }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px 12px 44px' : '14px 16px 14px 48px',
                    borderRadius: '12px',
                    border: '2px solid #e5e5e5',
                    fontSize: isMobile ? '14px' : '15px',
                    outline: 'none',
                    transition: 'border 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFC42D'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
            </div>

            {/* Subject Input */}
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: isMobile ? '13px' : '14px', 
                fontWeight: 600, 
                color: '#2b2b2b' 
              }}>
                Subject
              </label>
              <div style={{ position: 'relative' }}>
                <MessageSquare size={18} color="#999" style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)' 
                }} />
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What is this about?"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 14px 12px 44px' : '14px 16px 14px 48px',
                    borderRadius: '12px',
                    border: '2px solid #e5e5e5',
                    fontSize: isMobile ? '14px' : '15px',
                    outline: 'none',
                    transition: 'border 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#FFC42D'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: isMobile ? '13px' : '14px', 
                fontWeight: 600, 
                color: '#2b2b2b' 
              }}>
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                placeholder="Tell us more about your inquiry..."
                rows={isMobile ? "4" : "6"}
                style={{
                  width: '100%',
                  padding: isMobile ? '14px' : '16px',
                  borderRadius: '12px',
                  border: '2px solid #e5e5e5',
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: 'border 0.2s',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#FFC42D'}
                onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: isMobile ? '14px' : '16px',
                borderRadius: '12px',
                border: 'none',
                background: '#FFC42D',
                color: 'white',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(255, 196, 45, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#FFB400';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(255, 196, 45, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#FFC42D';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 196, 45, 0.3)';
              }}
            >
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div style={{
        background: 'linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%)',
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '32px 24px' : '48px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 800, margin: '0 0 12px 0' }}>
          Find Us on the Map
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: isMobile ? '14px' : '16px', opacity: 0.8 }}>
          Visit our office or explore our location online
        </p>
        <button style={{
          padding: isMobile ? '12px 28px' : '14px 32px',
          borderRadius: '12px',
          border: '2px solid #FFC42D',
          background: 'transparent',
          color: '#FFC42D',
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#FFC42D';
          e.target.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.color = '#FFC42D';
        }}>
          Open in Google Maps
        </button>
      </div>
    </div>
  );
}