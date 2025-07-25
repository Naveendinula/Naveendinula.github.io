/**
 * EIA Dashboard Page Functionality
 * Handles Power BI iframe loading, fallback display, and retry functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('powerbi-dashboard');
    const loader = document.getElementById('dashboardLoader');
    const fallback = document.getElementById('dashboard-fallback');
    const retryBtn = document.getElementById('retryButton');
    
    if (!iframe || !loader || !fallback || !retryBtn) {
        console.warn('EIA Dashboard: Some elements not found');
        return;
    }

    let timeoutId;
    
    function showFallback() {
        loader.style.display = 'none';
        iframe.style.opacity = '0';
        fallback.style.display = 'block';
        clearTimeout(timeoutId);
        console.log('EIA Dashboard: Showing fallback due to timeout or error');
    }
    
    function hideLoader() {
        loader.style.display = 'none';
        iframe.style.opacity = '1';
        clearTimeout(timeoutId);
        console.log('EIA Dashboard: iframe loaded successfully');
    }

    // Give the iframe a maximum of 10 seconds to load
    timeoutId = setTimeout(showFallback, 10000);

    // Event listeners for iframe
    iframe.addEventListener('load', hideLoader);
    iframe.addEventListener('error', showFallback);

    // Retry button functionality
    retryBtn.addEventListener('click', () => {
        fallback.style.display = 'none';
        loader.style.display = 'flex';
        iframe.style.opacity = '0';
        
        // Force reload by changing src
        const currentSrc = iframe.src;
        iframe.src = '';
        setTimeout(() => {
            iframe.src = currentSrc;
        }, 100);
        
        timeoutId = setTimeout(showFallback, 10000);
        console.log('EIA Dashboard: Retrying iframe load');
    });

    // Additional error handling for network issues
    window.addEventListener('online', () => {
        if (fallback.style.display === 'block') {
            console.log('EIA Dashboard: Network restored, attempting reload');
            retryBtn.click();
        }
    });
});
