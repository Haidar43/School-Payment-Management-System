import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { School, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginAdmin, loginParent, isAuthenticated } = useAuth();

  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  // If already authenticated, redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'parent') {
        navigate('/parent/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (role === 'admin') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    } else {
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.replace(/\s/g, '').length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setErrors({}); // Clear previous errors
  try {
    if (role === 'admin') {
      await loginAdmin(formData.email, formData.password);
      toast.success('Welcome back, Admin!');
      navigate('/admin/dashboard');
    } else {
      await loginParent(formData.phone, formData.password);
      toast.success('Welcome back!');
      navigate('/parent/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);

    // Handle different error types
    let errorMessage = 'Invalid credentials. Please try again.';

    if (error.response) {
      // Server responded with error
      errorMessage = error.response.data?.detail || errorMessage;
    } else if (error.request) {
      // Request made but no response (network error)
      errorMessage = 'Network error. Please check your connection.';
    } else {
      // Something else
      errorMessage = error.message || errorMessage;
    }

    setErrors({ general: errorMessage });
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-md flex items-center justify-center">
              <School className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-text-primary">
            SchoolPay
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            School Payment Management System
          </p>
        </div>

        {/* Role Toggle */}
        <div className="bg-surface border border-border rounded-md p-1 flex">
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-sm transition-colors ${
              role === 'admin'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('parent')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-sm transition-colors ${
              role === 'parent'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Parent
          </button>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {role === 'admin' ? (
              <div>
                <label htmlFor="email" className="input-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input pl-10 ${errors.email ? 'border-status-unpaid focus:ring-status-unpaid' : ''}`}
                    placeholder="admin@school.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-status-unpaid">{errors.email}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="input-label">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-text-secondary" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input pl-10 ${errors.phone ? 'border-status-unpaid focus:ring-status-unpaid' : ''}`}
                    placeholder="+234 801 234 5678"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-status-unpaid">{errors.phone}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-status-unpaid focus:ring-status-unpaid' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-status-unpaid">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="rounded-sm bg-red-50 border border-status-unpaid/20 p-3">
                <p className="text-sm text-status-unpaid">{errors.general}</p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Forgot Password - Coming Soon */}
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              <Link
                to="#"
                className="text-accent hover:text-accent-light font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info('Password reset feature coming soon!');
                }}
              >
                Forgot your password?
              </Link>
            </p>
          </div>

          {/* Setup Link - Only show if no admin exists (optional) */}
          <div className="text-center text-xs text-text-secondary border-t border-border pt-4">
            <p>
              Need to set up the system?{' '}
              <Link to="/setup" className="text-accent hover:text-accent-light font-medium">
                Run setup
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;