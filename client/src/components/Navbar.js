
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Home, BookOpen, BarChart2, PlusCircle, LogIn, UserPlus } from "lucide-react";
import { Navbar as BsNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import "./navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setExpanded(false);
  };

  const closeNav = () => setExpanded(false);

  return (
    <BsNavbar 
      bg="light"
      variant="light"
      expand="lg" 
      className="shadow-sm"
      expanded={expanded}
    >
      <Container>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BsNavbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold">
            <BookOpen className="me-2" size={24} />
            <span>Quiz Portal</span>
          </BsNavbar.Brand>
        </motion.div>
        
        <BsNavbar.Toggle 
          aria-controls="basic-navbar-nav" 
          onClick={() => setExpanded(expanded ? false : true)}
        />
        
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`mx-2 ${location.pathname === '/' ? 'active' : ''}`}
              onClick={closeNav}
            >
              <Home size={18} className="me-1" /> Home
            </Nav.Link>
            
            {user ? (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/quiz" 
                  className={`mx-2 ${location.pathname === '/quiz' ? 'active' : ''}`}
                  onClick={closeNav}
                >
                  <BookOpen size={18} className="me-1" /> Quizzes
                </Nav.Link>
                
                {user.role !== 'admin' && (
                  <Nav.Link 
                    as={Link} 
                    to="/ranking" 
                    className={`mx-2 ${location.pathname === '/ranking' ? 'active' : ''}`}
                    onClick={closeNav}
                  >
                    <BarChart2 size={18} className="me-1" /> Rankings
                  </Nav.Link>
                )}
                
                {user.role === 'admin' && (
                  <Nav.Link 
                    as={Link} 
                    to="/create-quiz" 
                    className={`mx-2 ${location.pathname === '/create-quiz' ? 'active' : ''}`}
                    onClick={closeNav}
                  >
                    <PlusCircle size={18} className="me-1" /> Create Quiz
                  </Nav.Link>
                )}
                
                <NavDropdown 
                  title={
                    <span>
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`} 
                        alt={user.role === 'admin' ? 'Admin Panel' : 'Profile'} 
                        className="rounded-circle me-1" 
                        style={{ width: '32px', height: '32px' }}
                      />
                      {user.name}
                    </span>
                  } 
                  id="basic-nav-dropdown"
                  align="end"
                  className="mx-2"
                >
                  {user.role === 'admin' ? (
                    <NavDropdown.Item 
                      as={Link} 
                      to="/admin" 
                      onClick={closeNav}
                    >
                      <i className="bi bi-speedometer2 me-2"></i> My Panel
                    </NavDropdown.Item>
                  ) : (
                    <NavDropdown.Item 
                      as={Link} 
                      to="/profile" 
                      onClick={closeNav}
                    >
                      <i className="bi bi-person me-2"></i> My Profile
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login" 
                  className={`btn btn-outline-primary mx-1 ${location.pathname === '/login' ? 'active' : ''}`}
                  onClick={closeNav}
                >
                  <LogIn size={18} className="me-1" /> Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/signup" 
                  className={`btn btn-primary text-white mx-1 ${location.pathname === '/signup' ? 'active' : ''}`}
                  onClick={closeNav}
                >
                  <UserPlus size={18} className="me-1" /> Sign Up
                </Nav.Link>
              </>
            )}
            

          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>

  );
};

export default Navbar;
