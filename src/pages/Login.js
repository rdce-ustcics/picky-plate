import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, signup: authSignup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !validateName(formData.name)) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    
    const newErrors = { ...errors };

    if (field === 'name' && !isLogin) {
      if (!validateName(formData.name)) {
        newErrors.name = 'Name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 8 characters';
      } else {
        delete newErrors.password;
      }
    }

    if (field === 'confirmPassword' && !isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setApiError('');
    setSuccessMessage('');

    if (touched[name]) {
      const newErrors = { ...errors };
      
      if (name === 'name' && !isLogin) {
        if (validateName(value)) {
          delete newErrors.name;
        }
      }
      
      if (name === 'email') {
        if (validateEmail(value)) {
          delete newErrors.email;
        }
      }

      if (name === 'password') {
        if (validatePassword(value)) {
          delete newErrors.password;
        }
        if (formData.confirmPassword && value === formData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
      }

      if (name === 'confirmPassword') {
        if (value === formData.password) {
          delete newErrors.confirmPassword;
        }
      }

      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setApiError('');
    setSuccessMessage('');
    
    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);

      try {
        let result;
        
        if (isLogin) {
          result = await authLogin(formData.email, formData.password);
        } else {
          result = await authSignup(formData.name, formData.email, formData.password);
        }

        if (result.success) {
          setSuccessMessage(result.message);
          navigate('/');
        } else {
          setApiError(result.message || 'Something went wrong');
        }
      } catch (error) {
        console.error('Auth error:', error);
        setApiError('Unable to connect to server. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setTouched({});
    setApiError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Section - Form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              {isLogin 
                ? 'Login to continue to PickAPlate' 
                : 'Sign up to start your food journey'}
            </p>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm sm:text-base">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    disabled={isLoading}
                    className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                      touched.name && errors.name 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-yellow-400'
                    } ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                {touched.name && errors.name && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-xs sm:text-sm">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading}
                  className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                    touched.email && errors.email 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-yellow-400'
                  } ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email"
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
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  disabled={isLoading}
                  className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                    touched.password && errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-yellow-400'
                  } ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    disabled={isLoading}
                    className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition text-sm sm:text-base ${
                      touched.confirmPassword && errors.confirmPassword 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-yellow-400'
                    } ${isLoading ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm text-yellow-500 hover:text-yellow-600 font-semibold"
                >
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
                  <span>{isLogin ? 'Logging in...' : 'Creating account...'}</span>
                </>
              ) : (
                <span>{isLogin ? 'Login' : 'Sign Up'}</span>
              )}
            </button>

            <div className="text-center text-sm sm:text-base">
              <span className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={switchMode}
                disabled={isLoading}
                className="text-yellow-500 hover:text-yellow-600 font-bold disabled:opacity-50"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </form>

          <div className="mt-6 sm:mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <button 
                disabled={isLoading}
                className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-semibold text-gray-700 text-xs sm:text-sm">Google</span>
              </button>
              <button 
                disabled={isLoading}
                className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-semibold text-gray-700 text-xs sm:text-sm">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-yellow-400 to-yellow-500 relative overflow-hidden items-center justify-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full opacity-30 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-300 rounded-full opacity-30 -ml-32 -mb-32"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-300 rounded-full opacity-20"></div>
          
          <div className="relative z-10 text-center text-white px-12">
            <h2 className="text-5xl font-bold mb-6">PickAPlate</h2>
            <p className="text-xl mb-4">Discover Smarter Food Choices</p>
            <p className="text-lg opacity-90">
              Join thousands of food lovers exploring the best dishes in town
            </p>
            
            <div className="mt-12 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold">10K+</div>
                <div className="text-sm opacity-90">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">500+</div>
                <div className="text-sm opacity-90">Restaurants</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">5K+</div>
                <div className="text-sm opacity-90">Dishes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}