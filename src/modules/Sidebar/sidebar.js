import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FiGrid, FiUser, FiZap, FiUsers, FiGlobe, FiPhoneCall, FiSettings,
  FiMessageCircle, FiMenu, FiX, FiBookOpen, FiMapPin
} from "react-icons/fi";
import { useAuth } from "../../auth/AuthContext";
import "./sidebar.css";

const items = [
  { to: "/", label: "Dashboard", icon: <FiGrid /> },
  { to: "/chatbot", label: "AI ChatBot", icon: <FiMessageCircle /> },
  { to: "/recipes", label: "Community Recipes", icon: <FiBookOpen /> },      
  { to: "/profile", label: "Profile", icon: <FiUser /> },
  { to: "/surprise", label: "Surprise me", icon: <FiZap /> },               
  { to: "/barkada-vote", label: "Barkada Vote", icon: <FiUsers /> },
  { to: "/explorer", label: "Cultural Food Explorer", icon: <FiGlobe /> },    
  { to: "/restaurants", label: "Restaurant Locator", icon: <FiMapPin /> },   
];

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.classList.add("mobile-menu-open");
    else document.body.classList.remove("mobile-menu-open");
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
          <div className="pap-logo-image">
            <div style={{
              width: 48, height: 48, borderRadius: "50%", background: "#FFC42D",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px"
            }}>
              🍽️
            </div>
          </div>

          <div className="pap-logo-text">
            Pick<span className="pap-logo-a">A</span>Plate<span className="pap-dot">.</span>
          </div>
        </Link>

        <nav className="pap-nav">
          {items
            .filter(it => !(it.to === "/profile" && !isAuthenticated))
            .map(it => (
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

          <NavLink
            to="/contact"
            end
            className={({ isActive }) => "pap-contact-pill" + (isActive ? " is-active" : "")}
            onClick={closeMobileMenu}
          >
            <span className="pap-icon"><FiPhoneCall /></span>
            <span className="pap-label">Contact Us</span>
          </NavLink>

          <NavLink
            to="/settings"
            end
            className={({ isActive }) => "pap-nav-item" + (isActive ? " is-active" : "")}
            onClick={closeMobileMenu}
          >
            <span className="pap-icon"><FiSettings /></span>
            <span className="pap-label">Settings</span>
          </NavLink>
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
              <div className="pap-login-sub">Access Profile</div>
              <button className="pap-login-btn" onClick={() => { logout(); closeMobileMenu(); }}>LOGOUT</button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
