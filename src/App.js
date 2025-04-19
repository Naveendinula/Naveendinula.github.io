import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import withRouter from "./hooks/withRouter"
import AppRoutes from "./app/routes";
import Header from "./header";
import AnimatedCursor from "./hooks/AnimatedCursor";
import "./App.css";
import NavigationSidebar from "./components/NavigationSidebar";

function _App() {
  const location = useLocation();

  return (
    <div className="cursor__dot">
      <AnimatedCursor />
      <Header />
      <NavigationSidebar />
      <AppRoutes location={location} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <_App />
    </Router>
  );
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root')
);