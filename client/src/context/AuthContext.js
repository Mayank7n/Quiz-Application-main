import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
// Support both local and production environments
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5000" 
  : "https://quiz-application-main-alpha.vercel.app";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const name = localStorage.getItem("name");
      const email = localStorage.getItem("email");
      if (token && role) {
        setUser({ token, role, name, email });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error loading auth state:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    try {
      setError(null);
      console.log('Attempting login with:', { email, role });
      console.log('API URL being used:', `${API_URL}/api/auth/login`);
      
      const loginData = { email, password, role };
      console.log('Sending login request with data:', loginData);
      
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      console.log('Login response status:', res.status);
      const data = await res.json();
      console.log('Login response data:', data);

      if (!res.ok) {
        const errorMsg = data.message || "Invalid credentials";
        console.error('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Store the authentication data
      const userData = {
        token: data.token,
        role: data.role,
        name: data.name || "",
        email: data.email || ""
      };
      
      console.log('Login successful, storing user data:', userData);
      
      localStorage.setItem("token", userData.token);
      localStorage.setItem("role", userData.role);
      localStorage.setItem("name", userData.name);
      localStorage.setItem("email", userData.email);
      setUser(userData);

      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      localStorage.removeItem("email");
      setUser(null);
      setError(null);
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  if (loading) {
    return null; // or a loading spinner component
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
