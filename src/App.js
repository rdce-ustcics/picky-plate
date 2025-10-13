import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Surprise from "./pages/Surprise";
import BarkadaVote from "./pages/Barkadavote";
import Explorer from "./pages/Explorer";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AdminPage from "./pages/AdminPage";
import Forbidden from "./pages/Forbidden";
import ChatBot from "./pages/ChatBot";
import { AuthProvider } from "./auth/AuthContext";
import RoleRoute, { GuestOnlyRoute } from "./auth/RoleRoute";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* All routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/profile"
              element={
                <RoleRoute allow={['user','admin']}>
                  <Profile />
                </RoleRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <RoleRoute allow={['admin']}>
                  <AdminPage />
                </RoleRoute>
              }
            />

            <Route path="/surprise" element={<Surprise />} />
            <Route path="/barkada-vote" element={<BarkadaVote />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/settings" element={<Settings />} />

            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />

            <Route path="/forbidden" element={<Forbidden />} />
          </Route>

          {/* ChatBot - OUTSIDE MainLayout */}
          <Route path="/chatbot" element={<ChatBot />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}