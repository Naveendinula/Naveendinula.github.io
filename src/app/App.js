import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router } from "react-router-dom";
import NavigationSidebar from "../components/NavigationSidebar";
import AppRoutes from "./routes"; // Import your AppRoutes component
import Footer from "../components/Footer";
import "./App.css";

export default function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="app-container">
        <NavigationSidebar />
        <main className="main-content">
          <div className="section-container">
            <AppRoutes /> {/* Use the AppRoutes component */}
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
}


