
import React from "react";
import "./style.css";
import { 
  FaPython, 
  FaJava, 
  FaReact, 
  FaGitAlt,
  FaHtml5, 
  FaJs,
  FaNodeJs,
  FaDatabase
} from "react-icons/fa";
import { 
  SiR,
  SiArduino,
  SiMongodb,
  SiGooglecolab,
  SiPycharm,
  SiEclipseide,
  SiPowerbi,
  SiExpress,
} from "react-icons/si";

const SkillsCarousel = () => {
  const skills = [
    { icon: FaPython, name: "Python" },
    { icon: FaJava, name: "Java" },
    { icon: FaDatabase, name: "SQL" },
    { icon: SiR, name: "R" },
    { icon: FaJs, name: "JavaScript" },
    { icon: FaHtml5, name: "HTML/CSS" },
    { icon: SiArduino, name: "Arduino" },
    { icon: FaReact, name: "React" },
    { icon: FaNodeJs, name: "Node.js" },
    { icon: SiExpress, name: "Express" },
    { icon: SiMongodb, name: "MongoDB" },
    { icon: FaGitAlt, name: "Git" },
    { icon: SiGooglecolab, name: "Google Colab" },
    { icon: SiPycharm, name: "PyCharm" },
    { icon: SiEclipseide, name: "Eclipse" },
    { icon: SiPowerbi, name: "Power BI" }
  ];

  // Create the duplicated list for seamless loop
  const allSkills = [...skills, ...skills];

  return (
    <div className="skills-carousel-container">
      <div className="skills-carousel-track">
        {allSkills.map((skill, index) => (
          <div key={index} className="skill-item">
            <skill.icon size={40} />
            <span>{skill.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsCarousel;
