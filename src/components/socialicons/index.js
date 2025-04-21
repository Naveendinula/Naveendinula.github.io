import React, { useState } from "react";
import "./style.css";
import {
  FaGithub,
  FaLinkedin,
  FaCircle,
  FaEnvelope,
  FaFilePdf
} from "react-icons/fa";
import { socialprofils } from "../../content_option";

const ICON_MAPPING = {
  default: FaCircle,
  linkedin: FaLinkedin,
  email: FaEnvelope,
  resume: FaFilePdf,
  github: FaGithub
};

export const Socialicons = (params) => {
  const [showEmailPopup, setShowEmailPopup] = useState(false);

  const handleEmailClick = (e) => {
    e.preventDefault();
    // Copy email to clipboard
    if (socialprofils.email) {
      const email = socialprofils.email.replace('mailto:', '');
      navigator.clipboard.writeText(email)
        .then(() => {
          setShowEmailPopup(true);
          setTimeout(() => setShowEmailPopup(false), 3000);
          console.log("Email copied to clipboard");
        })
        .catch(err => console.error('Could not copy email: ', err));
    }
  };

  return (
    <>
      {showEmailPopup && (
        <div className="email-popup">
          Email copied to clipboard!
        </div>
      )}
      <div className="stick_follow_icon">
        <ul>
          {Object.entries(socialprofils).map(([platform, url]) => {
            const IconComponent = ICON_MAPPING[platform] || ICON_MAPPING.default;
            return (
              <li key={platform}>
                {platform === 'email' ? (
                  <a 
                    href="#" 
                    onClick={handleEmailClick}
                    rel="noreferrer"
                    aria-label="Copy email to clipboard"
                  >
                    <IconComponent />
                  </a>
                ) : (
                  <a href={url} target="_blank" rel="noreferrer">
                    <IconComponent />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
        <p>Follow Me</p>
      </div>
    </>
  );
};
