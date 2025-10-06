import { Outlet } from "react-router-dom";
import Sidebar from "../modules/Sidebar/sidebar";  // Notice the lowercase "s"
import "./layout.css";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
