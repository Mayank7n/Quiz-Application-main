import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiUserPlus, FiKey } from "react-icons/fi";
import axios from "axios";
import "../styles/signup.css";
import AnimatedBackground from "../components/AnimatedBackground";

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    adminKey: ""
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    adminKey: false
  });

  // Get the redirect path from location state or default to "/"
  const from = location.state?.from?.pathname || "/";

  const validate = () => {
    if (!formData.name) return "Name is required";
    if (!formData.email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Please enter a valid email";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.role === "admin" && !formData.adminKey) return "Admin key is required";
    return "";
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      adminKey: newRole === "user" ? "" : prev.adminKey
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post(
        "https://quiz-application-main-alpha.vercel.app/api/auth/signup",
        formData
      );
      
      // Redirect to login with success message
      navigate("/login", { 
        state: { 
          from: from,
          message: "Account created successfully! Please log in to continue."
        } 
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name && 
                    formData.email && 
                    /\S+@\S+\.\S+/.test(formData.email) && 
                    formData.password.length >= 6 &&
                    (formData.role !== "admin" || formData.adminKey);
                    
  const showNameError = touched.name && !formData.name;
  const showEmailError = touched.email && (!formData.email || !/\S+@\S+\.\S+/.test(formData.email));
  const showPasswordError = touched.password && (!formData.password || formData.password.length < 6);
  const showAdminKeyError = touched.adminKey && formData.role === "admin" && !formData.adminKey;

  return (
    <div className="auth-wrapper">
      <AnimatedBackground />
      <div className="auth-box">
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p className="auth-subtitle">Join us to start your quiz journey</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                className={`auth-input ${showNameError ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                onBlur={() => handleBlur('name')}
                autoComplete="name"
                autoFocus
              />
            </div>
            {showNameError && (
              <div className="input-error-message">
                Name is required
              </div>
            )}
          </div>
          
          <div className="form-group">
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className={`auth-input ${showEmailError ? 'input-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
              />
            </div>
            {showEmailError && (
              <div className="input-error-message">
                {!formData.email ? 'Email is required' : 'Please enter a valid email'}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password (min 6 characters)"
                className={`auth-input ${showPasswordError ? 'input-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {showPasswordError && (
              <div className="input-error-message">
                {!formData.password ? 'Password is required' : 'Password must be at least 6 characters'}
              </div>
            )}
          </div>

          <div className="form-group role-selection">
            <label>Sign up as:</label>
            <div className="role-options">
              <button 
                type="button"
                className={`role-option ${formData.role === 'user' ? 'active' : ''}`}
                onClick={() => handleRoleChange('user')}
              >
                <FiUser className="role-icon" />
                <span>User</span>
              </button>
              <button 
                type="button"
                className={`role-option ${formData.role === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                <FiUser className="role-icon" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {formData.role === "admin" && (
            <div className="form-group">
              <div className="input-wrapper">
                <FiKey className="input-icon" />
                <input
                  type="password"
                  name="adminKey"
                  placeholder="Enter Admin Key"
                  className={`auth-input ${showAdminKeyError ? 'input-error' : ''}`}
                  value={formData.adminKey}
                  onChange={handleChange}
                  onBlur={() => handleBlur('adminKey')}
                />
              </div>
              {showAdminKeyError && (
                <div className="input-error-message">
                  Admin key is required
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            className={`auth-btn ${!isFormValid || isLoading ? 'disabled' : ''}`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <FiUserPlus className="btn-icon" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Log in</Link></p>
          <p className="terms-text">
            By signing up, you agree to our <Link to="/terms" className="auth-link">Terms</Link> and <Link to="/privacy" className="auth-link">Privacy Policy</Link>
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default SignupPage;
