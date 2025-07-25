document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const closeBtn = document.querySelector('.close');

    // Get all images in the content that should be clickable
    const clickableImages = document.querySelectorAll('.project-section img, .methodology img, .results img');

    // Add click event to all images
    clickableImages.forEach(function(img) {
        // Add cursor pointer style
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        
        // Add hover effect
        img.addEventListener('mouseenter', function() {
            img.style.transform = 'scale(1.02)';
            img.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        });
        
        img.addEventListener('mouseleave', function() {
            img.style.transform = 'scale(1)';
            img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        });

        // Add click event to open modal
        img.addEventListener('click', function() {
            modal.style.display = 'block';
            modalImg.src = this.src;
            modalImg.alt = this.alt;
            
            // Get caption from the following paragraph if it exists
            const nextElement = this.parentElement.nextElementSibling;
            if (nextElement && nextElement.tagName === 'P') {
                modalCaption.innerHTML = nextElement.innerHTML;
            } else {
                // Fallback to alt text
                modalCaption.textContent = this.alt;
            }
            
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal when clicking the X
    closeBtn.addEventListener('click', function() {
        closeModal();
    });

    // Close modal when clicking outside the image
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Function to close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore body scrolling
    }

    // Add CSS for hover effect on close button
    closeBtn.addEventListener('mouseenter', function() {
        this.style.opacity = '0.7';
    });
    
    closeBtn.addEventListener('mouseleave', function() {
        this.style.opacity = '1';
    });
});
