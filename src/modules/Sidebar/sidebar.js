import { NavLink, Link } from "react-router-dom";
import { FiGrid, FiUser, FiZap, FiUsers, FiGlobe, FiPhoneCall, FiSettings, FiMessageCircle } from "react-icons/fi"; // Chatbot icon
import { useAuth } from "../../auth/AuthContext";
import "./sidebar.css";

const items = [
  { to: "/", label: "Dashboard", icon: <FiGrid /> },
  { to: "/profile", label: "Profile", icon: <FiUser /> },
  { to: "/surprise", label: "Suprise me", icon: <FiZap /> },
  { to: "/barkada-vote", label: "Barkada Vote", icon: <FiUsers /> },
  { to: "/explorer", label: "Cultural Food Explorer", icon: <FiGlobe /> },
  { to: "/chatbot", label: "AI ChatBot", icon: <FiMessageCircle /> }, // Chatbot page
];

export default function Sidebar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <aside className="pap-sidebar">
      <Link to="/" className="pap-logo">
        Pick<span className="pap-logo-a">A</span>Plate<span className="pap-dot">.</span>
      </Link>

      <nav className="pap-nav">
        {items
          .filter(it => !(it.to === "/profile" && !isAuthenticated))
          .map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end
              className={({ isActive }) =>
                "pap-nav-item" + (isActive ? " is-active" : "")
              }
            >
              <span className="pap-icon">{it.icon}</span>
              <span className="pap-label">{it.label}</span>
            </NavLink>
          ))}
        <NavLink
          to="/contact"
          end
          className={({ isActive }) =>
            "pap-contact-pill" + (isActive ? " is-active" : "")
          }
        >
          <span className="pap-icon"><FiPhoneCall /></span>
          <span className="pap-label">Contact Us</span>
        </NavLink>

        <NavLink
          to="/settings"
          end
          className={({ isActive }) =>
            "pap-nav-item" + (isActive ? " is-active" : "")
          }
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
            <Link to="/login" className="pap-login-btn">LOGIN</Link>
          </>
        ) : (
          <>
            <div className="pap-login-title">You’re logged in</div>
            <div className="pap-login-sub">Access Profile</div>
            <button className="pap-login-btn" onClick={logout}>LOGOUT</button>
          </>
        )}
      </div>
    </aside>
  );
}
