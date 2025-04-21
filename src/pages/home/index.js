import React, { useState, useEffect } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { meta } from "../../content_option";
import { Socialicons } from "../../components/socialicons";

const Home = () => {
  const [displayText, setDisplayText] = useState("");
  const fullText = "Hi! I'm Naveen Panditharatne";
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100); // Adjust typing speed here (milliseconds per character)

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Home | {meta.title}</title>
        <meta name="description" content={meta.description} />
      </Helmet>
      <div className="greeting-container">
        <div className="greeting-text">
          {displayText}
          <span className="typing-cursor"></span>
        </div>
        <div className="status-indicators">
          <div className="availability-indicator">
            <div className="availability-dot"></div>
            <span>Available for work</span>
          </div>
          <div className="location-indicator">
            <div className="location-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <span>Madison, WI</span>
          </div>
        </div>
        <div className="horizontal-social-icons">
          <Socialicons />
        </div>
      </div>
    </HelmetProvider>
  );
};

export default Home;
