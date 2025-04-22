
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import "../styles/navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); 

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      className={`navbar ${darkMode ? "dark" : ""}`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }} 
    >
      <motion.h1 className="logo">Quiz Portal</motion.h1>

      <button className="menu-icon" onClick={toggleMenu}>
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <motion.ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <motion.li whileHover={{ scale: 1.1 }}>
          <Link to="/" onClick={closeMenu}>Home</Link>
        </motion.li>
        <motion.li whileHover={{ scale: 1.1 }}>
          <Link to="/quiz" onClick={closeMenu}>{user && user.role === "admin" ? "My Quiz" : "Quiz"}</Link>
        </motion.li>

        {user ? (
          <>
            {/* Show Rank only for non-admin users */}
            {user.role !== "admin" && (
              <motion.li whileHover={{ scale: 1.1 }}>
                <Link to="/ranking" onClick={closeMenu}>Rank</Link>
              </motion.li>
            )}
            <motion.li whileHover={{ scale: 1.1 }}>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </motion.li>
          </>
        ) : (
          <>
            <motion.li whileHover={{ scale: 1.1 }}>
              <Link to="/login">Login</Link>
            </motion.li>
            <motion.li whileHover={{ scale: 1.1 }}>
              <Link to="/signup">Signup</Link>
            </motion.li>
          </>
        )}
      </motion.ul>

      {/* ✅ Dark Mode Toggle Button ✅ */}
      <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </motion.nav>
  );
};

export default Navbar;
