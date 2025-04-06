import React, { useState, useEffect } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";

export const PowerBI = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for the Power BI embed
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const POWERBI_EMBED_URL = "https://app.fabric.microsoft.com/view?r=eyJrIjoiMTAzY2YzMjYtZjkxYy00N2U3LTkyM2EtOTVjZGI2ZDE5NmZkIiwidCI6IjdkYTQ1YTdmLTdhYTEtNDVmZS05ZWRiLWM5OTQyMjJiYTlmOCIsImMiOjN9";

  return (
    <HelmetProvider>
      <Container className="powerbi-wrapper">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Energy Performance and Fuel Utilization | {meta.title}</title>
          <meta name="description" content="Power BI Energy Performance and Fuel Utilization Dashboard" />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4">Energy Performance and Fuel Utilization</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="powerbi-description mb-4">
              <p>
                This interactive Power BI dashboard presents a comprehensive analysis of energy consumption patterns
                across various facilities. The analysis identifies areas of energy wastage and provides actionable
                insights to improve energy efficiency and reduce costs.
              </p>
            </div>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="powerbi-container">
              {loading ? (
                <div className="loader-container">
                  <div className="loader"></div>
                  <p>Loading dashboard...</p>
                </div>
              ) : (
                <iframe 
                  title="energy_dataPBI"
                  className="powerbi-iframe"
                  src={POWERBI_EMBED_URL}
                  frameBorder="0"
                  allowFullScreen={true}
                />
              )}
            </div>
          </Col>
        </Row>
        <Row className="mt-5">
          <Col>
            <div className="key-insights">
              <h3 className="mb-4">Key Insights</h3>
              <ul>
                <li>Identified peak consumption patterns across different time periods</li>
                <li>Highlighted facilities with abnormal energy usage compared to similar units</li>
                <li>Quantified potential cost savings through implementation of recommended efficiency measures</li>
                <li>Tracked performance of previously implemented energy-saving initiatives</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};

export default PowerBI;
