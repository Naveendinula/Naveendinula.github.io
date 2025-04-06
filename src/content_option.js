const logotext = "NAVEEN";
const meta = {
    title: "Naveen Panditharatne",
    description: "I'm Naveen Panditharatne, a Data Analyst and Computer Science graduate with experience in data engineering and machine learning",
};

const introdata = {
    title: "I'm Naveen Panditharatne",
    animated: {
        first: "I analyze data",
        second: "I build ML models",
        third: "I develop web applications",
    },
    description: "Data Analyst and Computer Science professional with experience in data engineering, machine learning, and web development.",
    your_img_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000",
};

const dataabout = {
    title: "About Me",
    aboutme: "I'm a Computer Science graduate from the University of Wisconsin-Whitewater with a background in mechanical engineering. I specialize in data analysis, machine learning, and web development. My experience spans from analyzing marketing metrics and energy consumption to developing machine learning models and web applications. I'm passionate about leveraging technology to solve complex problems and create innovative solutions.",
};
const worktimeline = [{
        jobtitle: "Data Analyst Intern",
        where: "American Solar Energy Society",
        date: "January 2025 - Present",
    },
    {
        jobtitle: "Volunteer Data Engineer",
        where: "Community Dreams Foundation",
        date: "November 2024 - Present",
    },
    {
        jobtitle: "Graduate Assistant",
        where: "University of Wisconsin-Whitewater",
        date: "September 2022 - May 2024",
    },
    {
        jobtitle: "Mechanical Engineer",
        where: "Lalan Group",
        date: "May 2021 - November 2021",
    },
    {
        jobtitle: "Engineering Intern",
        where: "Vidullanka PLC",
        date: "February 2021 - April 2021",
    },
];

const skills = [{
        name: "Python",
        value: 90,
    },
    {
        name: "R",
        value: 85,
    },
    {
        name: "JavaScript",
        value: 80,
    },
    {
        name: "SQL",
        value: 85,
    },
    {
        name: "Java",
        value: 75,
    },
    {
        name: "HTML/CSS",
        value: 80,
    },
    {
        name: "React",
        value: 70,
    },
];

const services = [{
        title: "Data Analysis & Visualization",
        description: "Expertise in analyzing complex datasets and creating informative visualizations using tools like Power BI, Excel, Python, and R to derive actionable insights.",
    },
    {
        title: "Machine Learning Development",
        description: "Implementation of machine learning models for various applications, including Physics-Informed Neural Networks for fluid mechanics simulation.",
    },
    {
        title: "Web Application Development",
        description: "Design and development of responsive web applications using modern frameworks like React, ensuring seamless user experience across multiple devices.",
    },
    {
        title: "Energy Data Management",
        description: "Experience in analyzing energy consumption data and load patterns to identify efficiency improvements and reduce wastage.",
    },
];

const dataportfolio = [
    // {
    //     img: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1000",
    //     description: "Physics-Informed Neural Network for Fluid Mechanics - Simulating Lid-Driven Cavity flow using machine learning",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000",
    //     description: "Neonatal Care Web App Frontend Design - Responsive React-based interface for medical applications",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
    //     description: "Marketing Analytics Dashboard - Power BI visualizations for campaign performance optimization",
    //     link: "#",
    // },
    {
        img: require("./assets/images/PowerBI project icon.png"),
        description: "Energy Consumption Analysis - Data-driven insights for reducing energy wastage and improving efficiency",
        link: "/powerbi",
    },
    // {
    //     img: "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=1000",
    //     description: "Azure Data Pipeline Configuration - Setup for the GreenConnect App's data workflows",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1581094487102-8688862c7350?q=80&w=1000",
    //     description: "Renewable Energy Data Management - Collaboration with Technical Divisions on solar and sustainability initiatives",
    //     link: "#",
    // },
];

const contactConfig = {
    YOUR_EMAIL: "ngnaveen.p@gmail.com",
    YOUR_FONE: "(608)381-9208",
    description: "Feel free to contact me for professional opportunities, collaborations, or questions about my work. I'm currently based in Madison, WI and open to both remote and local positions.",
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_id",
    YOUR_TEMPLATE_ID: "template_id",
    YOUR_USER_ID: "user_id",
};

const socialprofils = {
    github: "https://github.com/ngnaveen",
    linkedin: "https://linkedin.com/in/naveen-panditharathne",
    twitter: "https://twitter.com",
    facebook: "https://facebook.com",
};
export {
    meta,
    dataabout,
    dataportfolio,
    worktimeline,
    skills,
    services,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
};
