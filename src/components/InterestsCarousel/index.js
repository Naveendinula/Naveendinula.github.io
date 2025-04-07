import React from "react";
import "./style.css";
import { FaDumbbell, FaBookOpen, FaPodcast } from "react-icons/fa";
import { GiShuttlecock } from "react-icons/gi";

const InterestsCarousel = ({ interests }) => {
  // Function to get the appropriate icon for each interest
  const getInterestIcon = (interestName) => {
    switch(interestName.toLowerCase()) {
      case 'fitness':
        return <FaDumbbell className="interest-icon" />;
      case 'badminton':
        return <GiShuttlecock className="interest-icon" />;
      case 'webtoons':
        return <FaBookOpen className="interest-icon" />;
      case 'podcasts':
        return <FaPodcast className="interest-icon" />;
      default:
        return null;
    }
  };

  // Create multiple copies for a smooth infinite effect
  const extendedInterests = [...interests, ...interests, ...interests];

  return (
    <div className="interests-carousel-container">
      <div className="interests-carousel-track">
        {extendedInterests.map((interest, index) => (
          <div 
            key={index} 
            className="interest-carousel-item"
          >
            {getInterestIcon(interest.name)}
            <span>{interest.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterestsCarousel; 