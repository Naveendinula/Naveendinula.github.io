import React, { useState } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";
import { FaGithub, FaChartLine, FaFilter, FaChartBar, FaChartPie, FaMapMarkedAlt } from "react-icons/fa";

export const PowerBI = () => {
  const [isLoading, setIsLoading] = useState(true);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Energy Performance and Fuel Utilization Dashboard | {meta.title}</title>
        <meta name="description" content="Interactive Power BI dashboard analyzing energy performance and fuel utilization across different market structures" />
      </Helmet>
      <div className="powerbi-wrapper">
        <div className="powerbi-header">
          <h1 className="powerbi-title">Energy Performance and Fuel Utilization Dashboard</h1>
          <div className="powerbi-description">
            <p>
              This project analyzes energy performance and fuel utilization across diverse electricity market structures—competitive, hybrid, and monopoly. The interactive Power BI dashboard, spanning data from 2011 to 2024, examines key metrics such as Thermal Efficiency, Total Generation (MMBtu), and Total Fuel Consumption (MMBtu), offering actionable insights for energy strategy and operational improvements.
            </p>
          </div>
        </div>

        <div className="powerbi-container">
          {isLoading && (
            <div className="loader-container">
              <div className="loader"></div>
              <p>Loading dashboard...</p>
            </div>
          )}
          <iframe
            title="Fuel Utilization Analysis"
            src="https://app.fabric.microsoft.com/view?r=eyJrIjoiMTAzY2YzMjYtZjkxYy00N2U3LTkyM2EtOTVjZGI2ZDE5NmZkIiwidCI6IjdkYTQ1YTdmLTdhYTEtNDVmZS05ZWRiLWM5OTQyMjJiYTlmOCIsImMiOjN9"
            className="powerbi-iframe"
            onLoad={handleIframeLoad}
            style={{ opacity: isLoading ? 0 : 1 }}
          />
        </div>
          
        <div className="key-features">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <FaChartLine />
              </div>
              <div className="feature-content">
                <h3>Interactive Year Slicer</h3>
                <p>Select any year from 2011 to 2024 to instantly update KPIs, charts, and maps.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FaFilter />
              </div>
              <div className="feature-content">
                <h3>Market Structure Filters</h3>
                <p>Toggle between Competitive, Hybrid, and Monopoly market views to see how regulatory environments impact performance.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FaChartBar />
              </div>
              <div className="feature-content">
                <h3>Drill-Down Fuel Categories</h3>
                <p>Expand fuel categories into detailed fuel types for deep analysis of generation and fuel consumption.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FaChartPie />
              </div>
              <div className="feature-content">
                <h3>Dynamic KPI Cards</h3>
                <p>View both raw values and Year-Over-Year percentage changes.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FaMapMarkedAlt />
              </div>
              <div className="feature-content">
                <h3>Geographical Analysis</h3>
                <p>Use the embedded US map to filter by state and analyze local market dynamics.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="github-section">
          <a 
            href="https://github.com/Naveendinula/fuel-utilization-by-electricity-market" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="github-link"
          >
            <FaGithub /> View Project Repository
          </a>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default PowerBI;
