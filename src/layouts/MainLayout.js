import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../modules/Sidebar/sidebar";

export default function MainLayout() {
  const location = useLocation();
  
  // Hide sidebar on login/auth pages
  const hideSidebar = ['/login', '/forgot-password'].includes(location.pathname);

  return (
    <div className="flex">
      {!hideSidebar && <Sidebar />}
      <div className={hideSidebar ? "w-full" : "flex-1"}>
        <Outlet />
      </div>
    </div>
  );
}