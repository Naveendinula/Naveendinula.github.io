import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style.css';

const NavigationSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (linkPath) => {
    return path === linkPath || (path === '/' && linkPath === '/about');
  };

  return (
    <nav className="vertical-nav">
      <Link to="/about">
        <button className={`nav-button ${isActive('/about') ? 'active' : ''}`}>
          About
        </button>
      </Link>
      <Link to="/portfolio">
        <button className={`nav-button ${isActive('/portfolio') ? 'active' : ''}`}>
          Portfolio
        </button>
      </Link>
      <Link to="/contact">
        <button className={`nav-button ${isActive('/contact') ? 'active' : ''}`}>
          Contact
        </button>
      </Link>
    </nav>
  );
};

export default NavigationSidebar;