const logotext = "NAVEEN";
const meta = {
    title: "Naveen Panditharatne",
    description: "I'm Naveen Panditharatne, a Data Analyst and Computer Science graduate with experience in data engineering and machine learning",
};

const introdata = {
    title: "I'm Naveen Panditharatne",
    animated: {
        first: "I craft data-driven solutions",
        second: "I visualize meaningful insights",
        third: "I develop predictive models",
    },
    description: "Data Analyst and Computer Science professional with a Mechanical Engineering background. Experienced in data engineering, machine learning, and web development, I’m passionate about leveraging analytics to drive innovative energy solutions.",
    // your_img_url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000",
};

const dataabout = {
    title: "Summary",
    aboutme: "I'm a multidisciplinary engineer blending Computer Science and Mechanical Engineering expertise to drive sustainable energy solutions. Passionate about transforming data into actionable insights, I've led large-scale energy projects, developed forecasting models in Python, and crafted engaging dashboards with Power BI. I'm dedicated to advancing renewable technologies and energy efficiency to build a cleaner, smarter future.",
};

const lifestyle = {
    title: "Hobbies and Interests",
    description: "When I'm not immersed in code or analyzing data, I enjoy staying active through regular workouts and playing badminton. I find that physical activity helps me maintain a balanced mindset and approach problems with a fresh perspective. In my downtime, I'm an avid reader of webtoons and listener of podcasts, enjoying creative storytelling across different media formats.",
    interests: [
        {
            name: "Fitness",
            description: "Regular workouts to stay healthy and energized"
        },
        {
            name: "Badminton",
            description: "Competitive and recreational badminton games"
        },
        {
            name: "Webtoons",
            description: "Reading digital comics and graphic novels"
        },
        {
            name: "Podcasts",
            description: "Comedian hosted shows, D&D adventures, and science & tech discussions"
        }
    ]
};

const worktimeline = [
    {
        jobtitle: "Data Analyst Intern",
        where: "American Solar Energy Society",
        date: "January 2025 - Present",
        location: "Remote",
        description: "Analyze membership, webinar, and event data using Excel and Power BI to identify engagement trends and inform data-driven strategies for renewable energy programs. Collaborate with technical teams to cleanse and manage datasets, generate insightful visualizations and reports, supporting initiatives in solar energy and grid modernization."
    },
    {
        jobtitle: "Volunteer Data Engineer",
        where: "Community Dreams Foundation",
        date: "November 2024 - Present",
        location: "Remote",
        description: "Developed and optimized Azure-based data pipelines using ETL workflows for the Green Connect App, ensuring scalable and efficient data processing. Contributed to data modeling and documentation, enhancing system interoperability and team collaboration for an environmentally focused application."
    },
    {
        jobtitle: "Graduate Assistant",
        where: "UW Whitewater",
        date: "September 2022 - May 2024",
        location: "Whitewater, WI, USA",
        description: "Analyzed Google Ads and Facebook Ads performance metrics, creating Power BI dashboards to track key marketing KPIs and drive data-driven campaign optimizations. Maintained and updated campus web content, analyzing user engagement data to optimize accessibility and user experience."
    },
    {
        jobtitle: "Mechanical Engineer",
        where: "Lalan Group",
        date: "May 2021 - November 2021",
        location: "Sri Lanka",
        description: "Monitored and analyzed energy consumption data for a 16Mkcal/hr centralized thermic fluid heater, identifying key strategies for improving energy efficiency. Designed and optimized utility networks (water, compressed air) using AutoCAD, contributing to reduced operational inefficiencies. Managed machinery commissioning projects using MS Project, tracking progress and optimizing resource allocation based on project data."
    },
    {
        jobtitle: "Engineering Intern",
        where: "Vidullanka PLC",
        date: "February 2021 - April 2021",
        location: "Sri Lanka",
        description: "Developed a Python-based SARIMA forecasting model to predict energy consumption trends for biomass and hydropower projects, improving forecast accuracy. Conducted historical load pattern analysis to enable proactive energy management strategies and reduce operational waste."
    }
];

const educationtimeline = [
    {
        degree: "Master's, Computer Science",
        where: "University of Wisconsin - Whitewater",
        date: "January 2022 - May 2024",
        location: "Whitewater, WI, USA",
        description: ""
    },
    {
        degree: "Bachelor's, Mechanical Engineering",
        where: "University of Hong Kong",
        date: "September 2016 - December 2020",
        location: "Hong Kong",
        description: ""
    }
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

const dataportfolio = [
    {
        img: require("./assets/images/eia-dashboard.png"),
        title: "Energy Dashboard",
        description: "Energy Consumption Analysis - Data-driven insights for reducing energy wastage and improving efficiency",
        link: "/project/eiaproject",
    },
    // {
    //     img: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1000",
    //     title: "Physics-Informed Neural Network",
    //     description: "Physics-Informed Neural Network for Fluid Mechanics - Simulating Lid-Driven Cavity flow using machine learning",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000",
    //     title: "Neonatal Care Web App",
    //     description: "Neonatal Care Web App Frontend Design - Responsive React-based interface for medical applications",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
    //     title: "Marketing Analytics Dashboard",
    //     description: "Marketing Analytics Dashboard - Power BI visualizations for campaign performance optimization",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?q=80&w=1000",
    //     title: "Azure Data Pipeline",
    //     description: "Azure Data Pipeline Configuration - Setup for the GreenConnect App's data workflows",
    //     link: "#",
    // },
    // {
    //     img: "https://images.unsplash.com/photo-1581094487102-8688862c7350?q=80&w=1000",
    //     title: "Renewable Energy Data Management",
    //     description: "Renewable Energy Data Management - Collaboration with Technical Divisions on solar and sustainability initiatives",
    //     link: "#",
    // },
];

const contactConfig = {
    YOUR_EMAIL: "ngnaveen.p@gmail.com",
    YOUR_FONE: "(608)381-9208",
    YOUR_RESUME: "/documents/CV_NaveenPanditharatne.pdf",
    description: "Feel free to contact me for professional opportunities, collaborations, or questions about my work. I'm currently based in Madison, WI and open to both remote and local positions.",
    YOUR_SERVICE_ID: "service_157ttxq",
    YOUR_TEMPLATE_ID: "template_smhbjcj",
    YOUR_USER_ID: "6k7bYcRT2ICySW5Ak",
};

const socialprofils = {
    linkedin: "https://linkedin.com/in/naveen-panditharathne",
    email: contactConfig.YOUR_EMAIL,
    resume: contactConfig.YOUR_RESUME,
    github: "https://github.com/Naveendinula",
};
export {
    meta,
    dataabout,
    dataportfolio,
    worktimeline,
    educationtimeline,
    skills,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
    lifestyle,
};







