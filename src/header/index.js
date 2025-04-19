import React, { useState, useEffect } from "react";
import "./style.css";
import { VscGrabber, VscClose } from "react-icons/vsc";
import { Link } from "react-router-dom";
import { logotext } from "../content_option";

const Headermain = () => {
  const [isActive, setActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      const isScrollingDown = currentScroll > lastScroll;
      
      setScrolled(currentScroll > 50);
      
      if (currentScroll <= 0) {
        setHidden(false);
        setScrolled(false);
      } else if (isScrollingDown && currentScroll > 50) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const handleToggle = () => {
    setActive(!isActive);
    document.body.classList.toggle("ovhidden");
  };

  const headerClasses = [
    "site__header",
    scrolled && "scrolled",
    hidden && "hidden",
    isActive && "menu-open"
  ].filter(Boolean).join(" ");

  return (
    <>
      <header className={headerClasses}>
        <div className="header__container">
          <Link className="nav_ac" to="/">
            {logotext}
          </Link>
          
          <nav className="main__nav">
            <Link to="/about" className="nav__link">About</Link>
            <Link to="/portfolio" className="nav__link">Work</Link>
            <Link to="/contact" className="nav__link">Contact</Link>
          </nav>

          <button 
            className="menu__button" 
            onClick={handleToggle}
            aria-label="Toggle menu"
          >
            {isActive ? <VscClose /> : <VscGrabber />}
          </button>
        </div>

        <div className={`mobile__nav ${isActive ? "active" : ""}`}>
          <div className="mobile__nav-container">
            <Link 
              onClick={handleToggle} 
              to="/" 
              className="mobile__nav-link"
              style={{"--item-index": 0}}
            >
              Home
            </Link>
            <Link 
              onClick={handleToggle} 
              to="/about" 
              className="mobile__nav-link"
              style={{"--item-index": 1}}
            >
              About
            </Link>
            <Link 
              onClick={handleToggle} 
              to="/portfolio" 
              className="mobile__nav-link"
              style={{"--item-index": 2}}
            >
              Work
            </Link>
            <Link 
              onClick={handleToggle} 
              to="/contact" 
              className="mobile__nav-link"
              style={{"--item-index": 3}}
            >
              Contact
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Headermain;
