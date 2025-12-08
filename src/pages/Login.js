// src/pages/Login.js
import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:4000").replace(/\/+$/, "");

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, signup: authSignup } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 8;
  const validateFirstName = (firstName) => firstName.trim().length >= 2;
  const validateLastName = (lastName) => lastName.trim().length >= 2;

  const validateForm = () => {
    const newErrors = {};
    if (!isLogin && !validateFirstName(formData.firstName)) newErrors.firstName = "First name must be at least 2 characters";
    if (!isLogin && !validateLastName(formData.lastName)) newErrors.lastName = "Last name must be at least 2 characters";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email)) newErrors.email = "Please enter a valid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (!validatePassword(formData.password)) newErrors.password = "Password must be at least 8 characters";
    if (!isLogin) {
      if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = { ...errors };
    if (field === "firstName" && !isLogin) {
      if (!validateFirstName(formData.firstName)) errs.firstName = "First name must be at least 2 characters";
      else delete errs.firstName;
    }
    if (field === "lastName" && !isLogin) {
      if (!validateLastName(formData.lastName)) errs.lastName = "Last name must be at least 2 characters";
      else delete errs.lastName;
    }
    if (field === "email") {
      if (!formData.email) errs.email = "Email is required";
      else if (!validateEmail(formData.email)) errs.email = "Please enter a valid email address";
      else delete errs.email;
    }
    if (field === "password") {
      if (!formData.password) errs.password = "Password is required";
      else if (!validatePassword(formData.password)) errs.password = "Password must be at least 8 characters";
      else delete errs.password;
      if (formData.confirmPassword && formData.confirmPassword === formData.password) delete errs.confirmPassword;
    }
    if (field === "confirmPassword" && !isLogin) {
      if (!formData.confirmPassword) errs.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
      else delete errs.confirmPassword;
    }
    setErrors(errs);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    setApiError("");
    setSuccessMessage("");

    if (touched[name]) {
      const errs = { ...errors };
      if (name === "firstName" && !isLogin && validateFirstName(value)) delete errs.firstName;
      if (name === "lastName" && !isLogin && validateLastName(value)) delete errs.lastName;
      if (name === "email" && validateEmail(value)) delete errs.email;
      if (name === "password") {
        if (validatePassword(value)) delete errs.password;
        if (formData.confirmPassword && value === formData.confirmPassword) delete errs.confirmPassword;
      }
      if (name === "confirmPassword" && value === formData.password) delete errs.confirmPassword;
      setErrors(errs);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    const errs = validateForm();
    setErrors(errs);
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        // LOGIN → if UNVERIFIED, go to OTP; else go dashboard
        const result = await authLogin(formData.email, formData.password);

        if (result?.needsVerification) {
          try { localStorage.setItem("pap:activeUserId", formData.email); } catch {}
          setSuccessMessage(result?.message || "Please verify your email.");
          return navigate("/verify-otp", { replace: true, state: { email: result.email || formData.email } });
        }

        if (!result?.success) throw new Error(result?.message || "Login failed");

        try { localStorage.setItem("pap:activeUserId", formData.email); } catch {}
        setSuccessMessage(result?.message || "Logged in successfully");
        return navigate("/", { replace: true });
} else {
  // SIGNUP → create account, send OTP, then go to OTP page
  const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
  const result = await authSignup(fullName, formData.email, formData.password);
  
  if (!result?.success) {
    throw new Error(result?.message || "Signup failed");
  }

  // Request OTP for this email
  let initialCooldown = 0;
  try {
    const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
      credentials: "include",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      // console.error("Failed to send OTP after signup:", data?.message || res.statusText);
      // Still continue to OTP page - user can resend code
    } else {
      initialCooldown = Number.isFinite(data?.cooldownSec) ? Number(data.cooldownSec) : 60;
    }
  } catch (err) {
    // console.error("Failed to send OTP after signup:", err);
    // Still continue to OTP page - user can resend code
  }

  try {
    sessionStorage.setItem("pap:onboardingTrigger", "1");
    localStorage.setItem("pap:onboardingForce", "1");
  } catch {}

  // ✅ CRITICAL: Stop loading BEFORE navigating
  setIsLoading(false);
  
  setSuccessMessage(result?.message || "Account created successfully");
  
  // Small delay to show success message
  setTimeout(() => {
    navigate("/verify-otp", {
      replace: true,
      state: {
        email: formData.email,
        initialCooldown,
      },
    });
  }, 500);
}
    } catch (err) {
      // console.error("Auth error:", err);
      setApiError(err?.message || "Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((v) => !v);
    setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
    setTouched({});
    setApiError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Section - Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12">
          <div className="mb-6 sm:mb-8">
            <center><h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h1></center>
            <center><p className="text-sm sm:text-base text-gray-500">
              {isLogin ? "Login to continue to PickAPlate" : "Sign up to start your food journey"}
            </p></center>
          </div>

          {apiError && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm sm:text-base">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* First Name and Last Name - Side by Side */}
            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("firstName")}
                      disabled={isLoading}
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                        touched.firstName && errors.firstName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-400"
                      } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  </div>
                  {touched.firstName && errors.firstName && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{errors.firstName}</span>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("lastName")}
                      disabled={isLoading}
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                        touched.lastName && errors.lastName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-400"
                      } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  </div>
                  {touched.lastName && errors.lastName && (
                    <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{errors.lastName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur("email")}
                  disabled={isLoading}
                  className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                    touched.email && errors.email ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-400"
                  } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {touched.email && errors.email && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur("password")}
                  disabled={isLoading}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                    touched.password && errors.password ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-400"
                  } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur("confirmPassword")}
                    disabled={isLoading}
                    className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                      touched.confirmPassword && errors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-yellow-400"
                    } ${isLoading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={isLoading}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-400" />
                  <span className="text-xs sm:text-sm text-gray-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-xs sm:text-sm text-yellow-500 hover:text-yellow-600 font-semibold">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2.5 sm:py-3 rounded-xl transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>{isLogin ? "Logging in..." : "Creating account..."}</span>
                </>
              ) : (
                <span>{isLogin ? "Login" : "Sign Up"}</span>
              )}
            </button>

            <div className="text-center text-sm sm:text-base">
              <span className="text-gray-600">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading}
                className="text-yellow-500 hover:text-yellow-600 font-bold disabled:opacity-50"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </div>

          </form>

        </div>

        {/* Right Section - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-yellow-400 to-yellow-500 relative overflow-hidden items-center justify-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full opacity-30 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-300 rounded-full opacity-30 -ml-32 -mb-32"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-300 rounded-full opacity-20"></div>

          <div className="relative z-10 text-center text-white px-12">
            <h2 className="text-5xl font-bold mb-6">PickAPlate</h2>
            <p className="text-xl mb-4">Discover Smarter Food Choices</p>
            <p className="text-lg opacity-90">Join thousands of food lovers exploring the best dishes in town</p>
          </div>
        </div>
      </div> 
    </div>
  );
}