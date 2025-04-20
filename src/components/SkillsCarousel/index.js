import React from "react";
import "./style.css";
import { 
  FaPython, 
  FaJava, 
  FaReact, 
  FaHtml5, 
  FaJs,
  FaNodeJs,
  FaDatabase
} from "react-icons/fa";
import { 
  SiR,
  SiMongodb,
  SiPowerbi,
} from "react-icons/si";

const SkillsGrid = () => {
  const skills = [
    { icon: FaPython, name: "Python" },
    { icon: FaReact, name: "React" },
    { icon: SiMongodb, name: "MongoDB" },
    { icon: FaJava, name: "Java" },
    { icon: FaDatabase, name: "SQL" },
    { icon: SiR, name: "R" },
    { icon: FaJs, name: "JavaScript" },
    { icon: SiPowerbi, name: "Power BI" },
    { icon: FaNodeJs, name: "Node.js" },
    { icon: FaHtml5, name: "HTML/CSS" },
  ];

  return (
    <div className="skills-grid-container">
      <div className="skills-grid">
        {skills.map((skill, index) => (
          <div key={index} className="skill-card">
            <div className="skill-icon">
              <skill.icon />
            </div>
            <div className="skill-name">{skill.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsGrid;
