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
  lifestyle,
} from "../../content_option";
import SkillsCarousel from "../../components/SkillsCarousel";

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
          <Col lg="5">
            <h3 className="color_sec py-4">{dataabout.title}</h3>
          </Col>
          <Col lg="7" className="d-flex align-items-center">
            <div>
              <p>{dataabout.aboutme}</p>
            </div>
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="5">
            <h3 className="color_sec py-4">Skills</h3>
          </Col>
          <Col lg="7">
            <SkillsCarousel />
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="5">
            <h3 className="color_sec py-4">Work Timeline</h3>
          </Col>
          <Col lg="7">
            <table className="table caption-top">
              <tbody>
                {worktimeline.map((data, i) => {
                  return (
                    <tr key={i}>
                      <th scope="row">{data.jobtitle}</th>
                      <td>{data.where}</td>
                      <td>{data.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="5">
            <h3 className="color_sec py-4">{lifestyle.title}</h3>
          </Col>
          <Col lg="7">
            <div className="interests-grid">
              {lifestyle.interests.map((interest, i) => (
                <div key={i} className="interest-item">
                  {getInterestIcon(interest.name)}
                  <span>{interest.name}</span>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};

