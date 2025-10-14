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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ✅ Everything here shows the global Sidebar via MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />

            <Route
              path="/profile"
              element={
                <RoleRoute allow={["user", "admin"]}>
                  <Profile />
                </RoleRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <RoleRoute allow={["admin"]}>
                  <AdminPage />
                </RoleRoute>
              }
            />

            <Route path="/surprise" element={<Surprise />} />
            <Route path="/barkada-vote" element={<BarkadaVote />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/recipes" element={<CommunityRecipes />} />
            <Route path="/recipes/upload" element={<UploadRecipe />} />
            <Route path="/restaurants" element={<RestaurantLocator />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/chatbot" element={<ChatBot />} />
            
            {/* ✅ Login page WITH sidebar */}
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <Login />
                </GuestOnlyRoute>
              }
            />
          </Route>

          {/* 🚫 No routes outside MainLayout */}
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}