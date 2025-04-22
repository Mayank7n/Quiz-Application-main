import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import "../styles/signup.css";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    adminKey: "", // ✅ Admin Key added
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/signup`, formData);
      alert(res.data.message); // Show success message
      navigate("/login"); // Redirect to login
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-box"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <motion.h2
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Sign Up
        </motion.h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <motion.input
            type="text"
            name="name"
            placeholder="Name"
            className="auth-input"
            value={formData.name}
            onChange={handleChange}
          />
          <motion.input
            type="email"
            name="email"
            placeholder="Email"
            className="auth-input"
            value={formData.email}
            onChange={handleChange}
          />
          <motion.input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            value={formData.password}
            onChange={handleChange}
          />

          {/* Role Selection Dropdown */}
          <motion.select name="role" className="auth-input" value={formData.role} onChange={handleChange}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </motion.select>

          {/* ✅ Admin Key Input (Only visible if "Admin" is selected) */}
          {formData.role === "admin" && (
            <motion.input
              type="text"
              name="adminKey"
              placeholder="Enter Admin Key"
              className="auth-input"
              value={formData.adminKey}
              onChange={handleChange}
              required
            />
          )}

          <motion.button type="submit" className="auth-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Sign Up
          </motion.button>
        </form>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
