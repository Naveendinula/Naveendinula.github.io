import React from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";

const Home = () => {
  return (
    <HelmetProvider>
      <Container className="home-container">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Home | {meta.title}</title>
          <meta name="description" content={meta.description} />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="12">
            <h1 className="display-4 mb-4">Home</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>
        <Row className="sec_sp">
          <Col lg="12">
            {/* This container is intentionally left blank as requested */}
            <div className="home-content-placeholder">
              {/* Blank content area */}
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};

export default Home;
