# Portfolio Website

A modern, responsive portfolio website built with HTML, CSS, and JavaScript.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Interactive Portfolio**: Filterable project gallery
- **Contact Form**: Functional contact form with validation
- **Smooth Scrolling**: Seamless navigation between sections
- **Social Links**: Easy integration with your social media profiles

## Sections

1. **About Me (Homepage)**: Introduction and hero section with your photo and bio
2. **Skills**: Showcase your technical skills and expertise
3. **Portfolio**: Display your projects with filtering options
4. **Contact**: Contact form and information

## Customization Guide

### 1. Personal Information
Replace the following placeholders in `index.html`:

- **Name**: Replace "Your Name" with your actual name
- **Title/Bio**: Update the hero subtitle and description
- **Contact Info**: Update email, phone, and location in the contact section
- **Social Links**: Add your actual social media URLs

### 2. Profile Photo
Replace the placeholder in the hero section:
- Add your photo to the project folder
- Replace the `.image-placeholder` div with: `<img src="your-photo.jpg" alt="Your Name">`

### 3. Skills Section
Update the skills in `index.html`:
- Modify the skill categories and descriptions
- Change the icons (from Font Awesome) to match your skills
- Add or remove skill items as needed

### 4. Portfolio Projects
For each project in `index.html`:
- Replace project images (add to project folder and update src)
- Update project titles and descriptions
- Modify technology tags
- Add actual links to live demos and GitHub repositories
- Update the `data-category` for filtering

### 5. Contact Information
Update your contact details:
- Email address
- Phone number
- Location
- Social media links

### 6. Colors and Styling
Customize the color scheme in `styles.css`:
- Primary color: `#3498db` (blue)
- Secondary color: `#f39c12` (orange)
- Background gradient: `.hero` section
- Change these values to match your personal brand

## File Structure

```
portfolio/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
└── README.md          # This file
```

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript**: Interactive functionality
- **Font Awesome**: Icons
- **Google Fonts**: Inter font family

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Getting Started

1. **Clone or download** this repository
2. **Open `index.html`** in your web browser
3. **Customize** the content with your information
4. **Add your images** to the project folder
5. **Deploy** to your preferred hosting platform

## Deployment Options

- **GitHub Pages**: Free hosting for GitHub repositories
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **Traditional Web Hosting**: Upload files via FTP

## Performance Features

- **Optimized images**: Use WebP format for better performance
- **Minified CSS/JS**: For production, consider minifying files
- **CDN Integration**: Font Awesome and Google Fonts loaded from CDN
- **Responsive images**: Consider using `srcset` for different screen sizes

## SEO Considerations

- **Meta tags**: Add appropriate meta tags in the `<head>` section
- **Alt text**: Add descriptive alt text to all images
- **Structured data**: Consider adding JSON-LD structured data
- **Open Graph**: Add Open Graph meta tags for social media sharing

## Additional Features to Consider

- **Dark mode toggle**
- **Blog section**
- **Testimonials**
- **Resume/CV download**
- **Project case studies**
- **Animation library integration** (AOS, GSAP)

## Support

If you need help customizing your portfolio:

1. Check the comments in the code files
2. Refer to this README
3. Search online for HTML/CSS/JavaScript tutorials
4. Consider hiring a developer for advanced customizations

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coding!** 🚀
