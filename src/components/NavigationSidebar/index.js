import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './style.css';

const NavigationSidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (linkPath) => {
    // For About, consider both /about and root path (/) as active
    if (linkPath === '/about') {
      return path === linkPath || path === '/';
    }
    // For portfolio, also consider eiaproject as active
    if (linkPath === '/portfolio') {
      return path === linkPath || path === '/eiaproject';
    }
    // For other links, exact match
    return path === linkPath;
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