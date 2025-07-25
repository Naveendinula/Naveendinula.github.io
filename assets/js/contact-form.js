// Contact configuration
const contactConfig = {
    YOUR_EMAIL: "ngnaveen.p@gmail.com",
    YOUR_FONE: "(608)381-9208",
    YOUR_RESUME: "/documents/CV_NaveenPanditharatne.pdf",
    description: "Feel free to contact me for professional opportunities, collaborations, or questions about my work. I'm currently based in Madison, WI and open to both remote and local positions.",
    YOUR_SERVICE_ID: "service_157ttxq",
    YOUR_TEMPLATE_ID: "template_smhbjcj",
    YOUR_USER_ID: "6k7bYcRT2ICySW5Ak",
};

// Initialize EmailJS
(function() {
    emailjs.init(contactConfig.YOUR_USER_ID);
})();

// Form state management
let formData = {
    name: '',
    email: '',
    message: '',
    loading: false,
    alertmessage: '',
    variant: '',
    show: false
};

// Set form data state
const setFormdata = (newState) => {
    formData = { ...formData, ...newState };
    updateUI();
};

// Update UI based on form state
const updateUI = () => {
    const submitBtn = document.getElementById('submitBtn');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const alertMessage = document.getElementById('alertMessage');

    // Update button state
    if (formData.loading) {
        submitBtn.disabled = true;
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
    } else {
        submitBtn.disabled = false;
        buttonText.style.display = 'inline-block';
        loadingSpinner.style.display = 'none';
    }

    // Update alert message
    if (formData.show && formData.alertmessage) {
        alertMessage.textContent = formData.alertmessage;
        alertMessage.style.display = 'block';
        alertMessage.className = `co_alert ${formData.variant === 'success' ? 'success-message' : 'error-message'}`;
        
        // Auto-hide success messages after 5 seconds
        if (formData.variant === 'success') {
            setTimeout(() => {
                alertMessage.style.display = 'none';
                setFormdata({ show: false, alertmessage: '' });
            }, 5000);
        }
    } else {
        alertMessage.style.display = 'none';
    }
};

// Handle form submission
const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Update form data
    formData.name = name;
    formData.email = email;
    formData.message = message;
    
    setFormdata({ loading: true, show: false });

    // Template parameters for the email
    const templateParams = {
        from_name: formData.email,
        user_name: formData.name,
        to_name: contactConfig.YOUR_EMAIL,
        message: formData.message,
    };

    // Send email using EmailJS
    emailjs
        .send(
            contactConfig.YOUR_SERVICE_ID,
            contactConfig.YOUR_TEMPLATE_ID,
            templateParams,
            contactConfig.YOUR_USER_ID
        )
        .then(
            (result) => {
                console.log(result.text);
                setFormdata({
                    loading: false,
                    alertmessage: "SUCCESS! Thank you for your message. I'll get back to you soon!",
                    variant: "success",
                    show: true,
                });
                
                // Reset form
                document.getElementById('contactForm').reset();
            },
            (error) => {
                console.log(error.text);
                setFormdata({
                    loading: false,
                    alertmessage: `Failed to send! ${error.text}`,
                    variant: "danger",
                    show: true,
                });
                
                // Scroll to alert message
                document.getElementsByClassName("co_alert")[0].scrollIntoView({
                    behavior: 'smooth'
                });
            }
        );
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleSubmit);
    }
});
