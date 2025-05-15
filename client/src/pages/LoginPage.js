import "../styles/login.css";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import AnimatedBackground from "../components/AnimatedBackground";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  // Get the redirect path and success message from location state
  const from = location.state?.from?.pathname || "/";
  
  // Check for success message in location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const validate = () => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Please enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
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
      await login(email, password, role);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to login. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email && password && /\S+@\S+\.\S+/.test(email) && password.length >= 6;
  const showEmailError = touched.email && (!email || !/\S+@\S+\.\S+/.test(email));
  const showPasswordError = touched.password && (!password || password.length < 6);

  return (
    <div className="auth-wrapper">
      <AnimatedBackground />
      <div className="auth-box">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue to your account</p>
        </div>
        
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                placeholder="Email address"
                className={`auth-input ${showEmailError ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                autoComplete="email"
                autoFocus
              />
            </div>
            {showEmailError && (
              <div className="input-error-message">
                {!email ? 'Email is required' : 'Please enter a valid email'}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className={`auth-input ${showPasswordError ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                autoComplete="current-password"
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
                {!password ? 'Password is required' : 'Password must be at least 6 characters'}
              </div>
            )}
          </div>

          <div className="form-group role-selection">
            <label>Sign in as:</label>
            <div className="role-options">
              <button 
                type="button"
                className={`role-option ${role === 'user' ? 'active' : ''}`}
                onClick={() => setRole('user')}
              >
                <FiUser className="role-icon" />
                <span>User</span>
              </button>
              <button 
                type="button"
                className={`role-option ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                <FiUser className="role-icon" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`auth-btn ${!isFormValid || isLoading ? 'disabled' : ''}`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                <FiLogIn className="btn-icon" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup" className="auth-link">Create account</Link></p>
          <Link to="/forgot-password" className="forgot-password">
            Forgot your password?
          </Link>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="decorative-shape shape-1"></div>
      <div className="decorative-shape shape-2"></div>
      <div className="decorative-shape shape-3"></div>
    </div>
  );
};

export default LoginPage;
