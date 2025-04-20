import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Import components
import NavigationSidebar from './components/NavigationSidebar';
import Footer from './components/Footer';

// Import pages
import Home from './pages/home';
import About from './pages/about';
import Portfolio from './pages/portfolio';
import Contact from './pages/contact';
import EiaProject from './pages/eiaproject';

function App() {
  return (
    <Router>
      <div className="App">
        <NavigationSidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} exact />
            <Route path="/about" element={<About />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/eiaproject" element={<EiaProject />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;