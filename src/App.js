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
import ChatBot from "./pages/ChatBot";
import Recipe from "./pages/Recipe";
import RestaurantLocator from "./pages/RestaurantLocator";
import UploadRecipe from "./pages/UploadRecipe";
import ForgotPassword from "./pages/ForgotPassword";
import { AuthProvider } from "./auth/AuthContext";
import RoleRoute, { GuestOnlyRoute } from "./auth/RoleRoute";
import "./index.css";
import CommunityRecipes from "./pages/Recipe";
import Calendar from "./pages/Calendar";
import VerifyOtp from "./pages/VerifyOtp"; // ✅ ADD THIS

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ✅ All routes WITH Sidebar via MainLayout */}
          <Route element={<MainLayout />}>
            {/* 🌐 PUBLIC ROUTES - No login required */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="/recipes" element={<CommunityRecipes />} />
            <Route path="/verify-otp" element={<VerifyOtp />} /> {/* ✅ OTP page */}

            {/* 🔒 PROTECTED ROUTES - Login required */}
            <Route
              path="/profile"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Profile />
                </RoleRoute>
              }
            />

            <Route
              path="/surprise"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Surprise />
                </RoleRoute>
              }
            />

            <Route
              path="/barkada-vote"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <BarkadaVote />
                </RoleRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Calendar />
                </RoleRoute>
              }
            />

            <Route
              path="/explorer"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Explorer />
                </RoleRoute>
              }
            />

            <Route
              path="/restaurants"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <RestaurantLocator />
                </RoleRoute>
              }
            />

            <Route
              path="/contact"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Contact />
                </RoleRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Settings />
                </RoleRoute>
              }
            />

            <Route
              path="/recipes/upload"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <UploadRecipe />
                </RoleRoute>
              }
            />

            {/* 🔐 ADMIN ONLY */}
            <Route
              path="/admin"
              element={
                <RoleRoute allow={["admin"]}>
                  <AdminPage />
                </RoleRoute>
              }
            />

            {/* 🚪 LOGIN & PASSWORD RESET */}
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
