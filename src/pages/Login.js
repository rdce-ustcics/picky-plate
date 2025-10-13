import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (Object.keys(newErrors).length === 0) {
      alert(`${isLogin ? 'Login' : 'Signup'} successful!\nEmail: ${formData.email}`);
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
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="w-1/2 p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p className="text-gray-500">
              {isLogin 
                ? 'Login to continue to PickAPlate' 
                : 'Sign up to start your food journey'}
            </p>
          </div>

          <div className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                      touched.name && errors.name 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-yellow-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {touched.name && errors.name && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition ${
                    touched.email && errors.email 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-yellow-400'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {touched.email && errors.email && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition ${
                    touched.password && errors.password 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-gray-200 focus:border-yellow-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none transition ${
                      touched.confirmPassword && errors.confirmPassword 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-200 focus:border-yellow-400'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-yellow-400" />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button className="text-sm text-yellow-500 hover:text-yellow-600 font-semibold">
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition transform hover:scale-105 shadow-lg"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>

            <div className="text-center">
              <span className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={switchMode}
                className="text-yellow-500 hover:text-yellow-600 font-bold"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-semibold text-gray-700">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-semibold text-gray-700">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 bg-gradient-to-br from-yellow-400 to-yellow-500 relative overflow-hidden flex items-center justify-center">
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