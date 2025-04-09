import React, { useState } from "react";
import { FaMapMarkerAlt, FaEnvelope, FaGithub, FaLinkedin, FaChevronRight } from "react-icons/fa";
import { contactConfig, socialprofils } from "../../content_option";
import "./style.css";

const ContactSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`contact-sidebar-wrapper ${isOpen ? 'open' : ''}`}>
      <button 
        className="contact-toggle" 
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close contact information" : "Open contact information"}
      >
        <FaChevronRight className={`toggle-icon ${isOpen ? 'open' : ''}`} />
      </button>
      
      <div className="contact-sidebar-content">
        <div className="contact-item">
          <FaMapMarkerAlt className="contact-icon" />
          <div>
            <div className="contact-label">LOCATION</div>
            <div className="contact-value">Madison, WI, USA</div>
          </div>
        </div>
        
        <div className="contact-item">
          <FaEnvelope className="contact-icon" />
          <div>
            <div className="contact-label">EMAIL</div>
            <div className="contact-value">{contactConfig.YOUR_EMAIL}</div>
          </div>
        </div>
        
        <div className="contact-item">
          <FaGithub className="contact-icon" />
          <div>
            <div className="contact-label">GITHUB</div>
            <div className="contact-value">
              <a href={socialprofils.github} target="_blank" rel="noopener noreferrer">
                Naveendinula
              </a>
            </div>
          </div>
        </div>
        
        <div className="contact-item">
          <FaLinkedin className="contact-icon" />
          <div>
            <div className="contact-label">LINKEDIN</div>
            <div className="contact-value">
              <a href={socialprofils.linkedin} target="_blank" rel="noopener noreferrer">
                Naveen Panditharatne
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSidebar; 
