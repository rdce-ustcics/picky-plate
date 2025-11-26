import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../modules/Sidebar/sidebar";
import "./layout.css";

export default function MainLayout() {
  const location = useLocation();

  // Only hide sidebar on forgot-password page (sidebar now shows on login)
  const hideSidebar = ['/forgot-password'].includes(location.pathname);

  return (
    <div className="app-shell">
      {!hideSidebar && <Sidebar />}
      <main className={`app-content ${hideSidebar ? "w-full" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}