import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { FaDumbbell, FaBookOpen, FaPodcast } from "react-icons/fa";
import { GiShuttlecock } from "react-icons/gi";
import {
  dataabout,
  meta,
  worktimeline,
  educationtimeline,
  lifestyle,
} from "../../content_option";
import SkillsGrid from "../../components/SkillsCarousel";
import ExperienceEducationTabs from "../../components/ExperienceEducationTabs";

export const About = () => {
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

  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> About | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>

        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4">About me</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>

        <Row className="sec_sp">
          <Col lg="4">
            <h3 className="color_sec py-4">{dataabout.title}</h3>
          </Col>
          <Col lg="8" className="d-flex align-items-center">
            <div>
              <p>{dataabout.aboutme}</p>
            </div>
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="4">
            <h3 className="color_sec py-4">Skills</h3>
          </Col>
          <Col lg="8">
            <SkillsGrid />
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="4">
            <h3 className="color_sec py-4">Timeline</h3>
          </Col>
          <Col lg="8">
            <ExperienceEducationTabs 
              workTimeline={worktimeline} 
              educationTimeline={educationtimeline} 
            />
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="4">
            <h3 className="color_sec py-4">{lifestyle.title}</h3>
          </Col>
          <Col lg="8">
            <div className="interests-container">
              <div className="interest-item">
                <FaDumbbell className="interest-icon" />
                <span>Fitness</span>
              </div>
              <div className="interest-item">
                <GiShuttlecock className="interest-icon" />
                <span>Badminton</span>
              </div>
              <div className="interest-item">
                <FaBookOpen className="interest-icon" />
                <span>Webtoons</span>
              </div>
              <div className="interest-item">
                <FaPodcast className="interest-icon" />
                <span>Podcasts</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};



