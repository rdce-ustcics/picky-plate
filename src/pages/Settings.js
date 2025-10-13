import { useState } from "react";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);
  const [location, setLocation] = useState(true);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FFC42D 0%, #FFD970 100%)',
        borderRadius: '20px',
        padding: '40px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-100px',
          right: '-100px'
        }} />
        <div style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-50px',
          right: '50px'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 900, 
            margin: '0 0 8px 0',
            color: '#000'
          }}>
            General Settings
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '14px',
            color: '#000',
            opacity: 0.8
          }}>
            Manage your account and personalize your experience
          </p>
        </div>
      </div>

      {/* Account Settings Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          margin: '0 0 24px 0',
          color: '#000'
        }}>
          Account Settings
        </h2>

        <SettingRow
          label="Email Notifications"
          checked={emailNotifications}
          onChange={setEmailNotifications}
        />
        <SettingRow
          label="Allow Notifications"
          checked={allowNotifications}
          onChange={setAllowNotifications}
        />
      </div>

      {/* Security Settings Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          margin: '0 0 24px 0',
          color: '#000'
        }}>
          Security Settings
        </h2>

        <SettingRow
          label="Save login info"
          checked={saveLoginInfo}
          onChange={setSaveLoginInfo}
        />
      </div>

      {/* Allow Location Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          margin: '0 0 24px 0',
          color: '#000'
        }}>
          Allow Location
        </h2>

        <SettingRow
          label="Location"
          checked={location}
          onChange={setLocation}
        />
      </div>
    </div>
  );
}

function SettingRow({ label, checked, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '20px',
      marginBottom: '20px',
      borderBottom: '1px solid #f0f0f0'
    }}>
      <span style={{ 
        fontSize: '15px', 
        fontWeight: 500,
        color: '#2b2b2b'
      }}>
        {label}
      </span>
      
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '52px',
        height: '28px',
        borderRadius: '14px',
        background: checked ? '#FFC42D' : '#e5e5e5',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s ease'
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '3px',
          left: checked ? '27px' : '3px',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
}