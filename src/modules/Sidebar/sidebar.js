// src/modules/Sidebar/sidebar.js
import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { FiGrid, FiUser, FiUsers, FiGlobe, FiSettings, FiMessageCircle, FiMenu, FiX, FiBookOpen, FiMapPin } from "react-icons/fi";
import { useAuth } from "../../auth/AuthContext";
import "./sidebar.css";

const Sidebar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ADD THESE DEBUG LINES
  console.log('🔍 Sidebar Debug:');
  console.log('User:', user);
  console.log('User Role:', user?.role);
  console.log('Is Admin?:', user?.role === 'admin');

  useEffect(() => {
    if (isMobileMenuOpen) document.body.classList.add("mobile-menu-open");
    else document.body.classList.remove("mobile-menu-open");
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Items array with conditional admin button
  const items = [
    { to: "/", label: "Dashboard", icon: <FiGrid /> },
    { to: "/chatbot", label: "AI ChatBot", icon: <FiMessageCircle /> },
    { to: "/recipes", label: "Community Recipes", icon: <FiBookOpen /> },
    { to: "/profile", label: "Profile", icon: <FiUser /> },
    { to: "/barkada-vote", label: "Barkada Vote", icon: <FiUsers /> },
    { to: "/explorer", label: "Cultural Food Explorer", icon: <FiGlobe /> },
    { to: "/restaurants", label: "Restaurant Locator", icon: <FiMapPin /> },
    // Conditionally add the Admin button ONLY if user is admin
    ...(user?.role === 'admin' ? [{ to: "/admin", label: "Admin Dashboard", icon: <FiSettings /> }] : [])
  ];
  
  console.log('📋 Items array:', items);
  console.log('📋 Items count:', items.length);
  
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMobileMenu} />}

      {/* Sidebar */}
      <aside className={`pap-sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <Link to="/" className="pap-logo-container" onClick={closeMobileMenu}>
          {/* 🔄 CHANGED: Using picklogo.png instead of emoji */}
          <div className="pap-logo-image">
            <img 
              src="/images/picklogo.png" 
              alt="PickAPlate Logo" 
              className="pap-logo-img"
            />
          </div>

          <div className="pap-logo-text">
            Pick<span className="pap-logo-a">A</span>Plate<span className="pap-dot">.</span>
          </div>
        </Link>

        <nav className="pap-nav">
          {items.map(it => (
            <NavLink
              key={it.to}
              to={it.to}
              end
              className={({ isActive }) => "pap-nav-item" + (isActive ? " is-active" : "")}
              onClick={closeMobileMenu}
            >
              <span className="pap-icon">{it.icon}</span>
              <span className="pap-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pap-login-card">
          {!isAuthenticated ? (
            <>
              <div className="pap-login-title">Log in to Unlock</div>
              <div className="pap-login-sub">More Features</div>
              <Link to="/login" className="pap-login-btn" onClick={closeMobileMenu}>LOGIN</Link>
            </>
          ) : (
            <>
              <div className="pap-login-title">You're logged in</div>
              <div className="pap-login-sub">
                {user?.role === 'admin' ? 'Admin' : 'User'} • {user?.name || user?.email}
              </div>
              <button className="pap-login-btn" onClick={() => { logout(); closeMobileMenu(); }}>LOGOUT</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;