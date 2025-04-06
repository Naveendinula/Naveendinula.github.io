import React from "react";
import "./style.css";
import { 
  FaPython, 
  FaJava, 
  FaReact, 
  FaDatabase, 
  FaHtml5, 
  FaJs,
  FaAws
} from "react-icons/fa";
import { 
  SiR,
  SiCplusplus,
  SiKubernetes,
  SiPostgresql,
  SiMongodb
} from "react-icons/si";

const SkillsCarousel = () => {
  const skills = [
    { icon: SiCplusplus, name: "C++" },
    { icon: FaJava, name: "Java" },
    { icon: FaJs, name: "JavaScript" },
    { icon: FaPython, name: "Python" },
    { icon: FaReact, name: "React" },
    { icon: SiR, name: "R" },
    { icon: FaDatabase, name: "SQL" },
    { icon: SiKubernetes, name: "Kubernetes" },
    { icon: SiPostgresql, name: "PostgreSQL" },
    { icon: FaAws, name: "AWS" },
    { icon: SiMongodb, name: "MongoDB" },
    { icon: FaHtml5, name: "HTML/CSS" },
  ];

  return (
    <div className="skills-carousel-container">
      <div className="skills-carousel-track">
        {/* Duplicate the skills array for seamless infinite loop */}
        {[...skills, ...skills].map((skill, index) => (
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