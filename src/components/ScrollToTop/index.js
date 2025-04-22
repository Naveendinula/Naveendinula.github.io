import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls the window to the top whenever
 * the pathname in the URL changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo(0, 0);
    
    // If you have a specific container you want to scroll instead of the window,
    // you can use the following approach:
    // const mainContent = document.querySelector('.section-container');
    // if (mainContent) {
    //   mainContent.scrollTop = 0;
    // }
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;