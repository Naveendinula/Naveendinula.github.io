import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavigationSidebar from "../components/NavigationSidebar";
import { About } from "../pages/about";
import { Portfolio } from "../pages/portfolio";
import { ContactUs } from "../pages/contact";
import Home from "../pages/home";
import Footer from "../components/Footer";
import "./App.css";

export default function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="app-container">
        <NavigationSidebar />
        <main className="main-content">
          <div className="section-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
}


