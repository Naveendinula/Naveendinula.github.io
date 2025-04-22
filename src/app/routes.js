import React from "react";
import { Routes, Route } from "react-router-dom";
import withRouter from "../hooks/withRouter";
import { About } from "../pages/about";
import { Portfolio } from "../pages/portfolio";
import { ContactUs } from "../pages/contact";
import { PowerBI } from "../pages/eiaproject";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const AnimatedRoutes = withRouter(({ location }) => (
  <TransitionGroup>
    <CSSTransition
      key={location.key}
      timeout={{
        enter: 400,
        exit: 400,
      }}
      classNames="page"
      unmountOnExit
    >
      <Routes location={location}>
        <Route exact path="/" element={<About />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/contact" element={<ContactUs />} />
        {/* Updated project route with nested structure */}
        <Route path="/project/eiaproject" element={<PowerBI />} />
        {/* Keep old route temporarily for backward compatibility */}
        <Route path="/eiaproject" element={<PowerBI />} />
        <Route path="*" element={<About />} />
      </Routes>
    </CSSTransition>
  </TransitionGroup>
));

function AppRoutes() {
  return (
    <div className="s_c">
      <AnimatedRoutes />
    </div>
  );
}

export default AppRoutes;
