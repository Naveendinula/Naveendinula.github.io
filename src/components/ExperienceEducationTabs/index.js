import React, { useState } from "react";
import "./style.css";
import { FaBriefcase, FaGraduationCap } from "react-icons/fa";

const ExperienceEducationTabs = ({ workTimeline, educationTimeline }) => {
  const [activeTab, setActiveTab] = useState("work");

  return (
    <div className="experience-education-container">
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === "work" ? "active" : ""}`}
          onClick={() => setActiveTab("work")}
        >
          <FaBriefcase className="tab-icon" />
          <span>Work Experience</span>
        </button>
        <button 
          className={`tab ${activeTab === "education" ? "active" : ""}`}
          onClick={() => setActiveTab("education")}
        >
          <FaGraduationCap className="tab-icon" />
          <span>Education</span>
        </button>
      </div>

      <div className="timeline-container">
        {activeTab === "work" ? (
          <div className="timeline">
            {workTimeline.map((data, i) => {
              // Assign different colors to the dots based on index
              const dotColors = ['blue', 'yellow', 'green', 'red'];
              const colorClass = dotColors[i % dotColors.length];

              return (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${colorClass}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-date">{data.date}</div>
                    <h4 className="timeline-title">{data.jobtitle}</h4>
                    <div className="timeline-subtitle">{data.where}</div>
                    {data.description && (
                      <div className="timeline-description">
                        <ul>
                          <li>{data.description}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="timeline">
            {educationTimeline.map((data, i) => {
              // Assign different colors to the dots based on index
              const dotColors = ['orange', 'purple', 'teal', 'pink'];
              const colorClass = dotColors[i % dotColors.length];

              return (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${colorClass}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-date">{data.date}</div>
                    <h4 className="timeline-title">{data.degree}</h4>
                    <div className="timeline-subtitle">{data.where}</div>
                    <div className="timeline-location">{data.location}</div>
                    {data.description && (
                      <div className="timeline-description">
                        <ul>
                          <li>{data.description}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceEducationTabs;