import React from "react";
import "./style.css";
import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { socialprofils } from "../../content_option";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">Navigation</h3>
            <nav className="footer-nav">
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/about" className="footer-link">About</Link>
              <Link to="/portfolio" className="footer-link">Work</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
            </nav>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-title">Connect</h3>
            <div className="footer-social">
              <a 
                href={socialprofils.github} 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-social-link"
              >
                <FaGithub />
                <span>GitHub</span>
              </a>
              <a 
                href={socialprofils.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-link"
              >
                <FaLinkedin />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">
            © {currentYear} Naveen Panditharatne. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;