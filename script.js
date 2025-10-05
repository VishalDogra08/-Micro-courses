// --- FIREBASE IMPORTS & CONFIG ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- AI & EXTERNAL API SERVICES ---
const transcriptionService = {
    /**
     * Simulates calling an AI Speech-to-Text API.
     * In a real application, this would make a fetch request to a backend server,
     * which would then securely call the AI service (e.g., AssemblyAI, Google Speech-to-Text).
     * @param {string} videoUrl - The URL of the video to be transcribed.
     * @param {string} lessonTitle - The title of the lesson for context.
     * @returns {Promise<string>} A promise that resolves with the generated transcript.
     */
    generate(videoUrl, lessonTitle) {
        return new Promise(resolve => {
            setTimeout(() => {
                const transcript = `This is a high-quality, AI-generated transcript for the lesson titled "${lessonTitle}". In a real-world scenario, this text would be the output from a service like Google Speech-to-Text. The system would analyze the audio from the provided video URL and convert the spoken words into this text format, complete with punctuation and timing information. This greatly improves accessibility for learners who are hearing-impaired or who prefer to read along with the video. The process is fully automated.`;
                resolve(transcript);
            }, 2500);
        });
    }
};

// --- IMPORTANT: CONFIGURE FIREBASE ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
const appId = 'default-app-id'; // Or your dynamic app ID

// --- APP LOGIC ---
const app = {
    // --- LOCAL STORAGE MANAGEMENT ---
    storage: {
        save(key, data) {
            try {
                localStorage.setItem(`microcourses_${key}`, JSON.stringify(data));
            } catch (error) {
                console.error('Failed to save to localStorage:', error);
            }
        },
        
        load(key, defaultValue = null) {
            try {
                const data = localStorage.getItem(`microcourses_${key}`);
                return data ? JSON.parse(data) : defaultValue;
            } catch (error) {
                console.error('Failed to load from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(`microcourses_${key}`);
            } catch (error) {
                console.error('Failed to remove from localStorage:', error);
            }
        }
    },
    // --- STATE MANAGEMENT ---
    state: {
        currentUser: null,
        currentRole: null, // 'learner', 'creator', 'admin'
        activeCategoryId: 'all',
        pagination: {
            currentPage: 1,
            coursesPerPage: 6,
        },
        categories: [
            { id: 1, name: 'Web Development' },
            { id: 2, name: 'Programming' },
            { id: 3, name: 'Data Science' },
            { id: 4, name: 'Design' }
        ],
        users: [ // Mock user database to allow for cross-user interaction (e.g., admin approving a learner)
            { uid: 'default-learner', email: 'learner@example.com', role: 'learner', progress: {} },
            { uid: 'default-creator', email: 'creator@example.com', role: 'creator', progress: {} },
            { uid: 'default-admin', email: 'admin@mail.com', role: 'admin', progress: {} },
            // New users will be added here upon sign-up
        ],
        courses: [
            { id: 1, categoryId: 1, title: 'Introduction to Web Development', description: 'Learn the basics of HTML, CSS, and JavaScript to build your first website from scratch.', thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 1, title: 'HTML Fundamentals', videoUrl: 'https://www.youtube.com/embed/pQN-pnXPaVg', transcript: 'In this lesson, we cover the basic structure of an HTML document, including tags like <html>, <head>, and <body>. You will learn how to create headings, paragraphs, and lists.' },
                { id: 2, title: 'CSS Styling Techniques', videoUrl: 'https://www.youtube.com/embed/OEV8gHsKqL4', transcript: 'We will explore how to style your HTML with CSS. This includes changing colors, fonts, and layout. We will also look at the box model: content, padding, border, and margin.' },
                { id: 3, title: 'JavaScript for Beginners', videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk', transcript: 'Get started with JavaScript, the programming language of the web. Learn about variables, data types, operators, and how to make your pages interactive with functions.' },
            ]},
            { id: 2, categoryId: 1, title: 'Advanced CSS and Sass', description: 'Dive deep into modern CSS features like Flexbox, Grid, and animations. Learn Sass for more maintainable stylesheets.', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 4, title: 'Flexbox Crash Course', videoUrl: 'https://www.youtube.com/embed/3YW65K6LcIA', transcript: 'Master Flexbox for building complex, responsive layouts with ease. We will cover containers, items, and all the alignment properties.' },
                { id: 26, title: 'CSS Grid Layout', videoUrl: 'https://www.youtube.com/embed/jV8B24rSN5o', transcript: 'Learn the powerful CSS Grid for two-dimensional layouts. We will create a full page layout from scratch, exploring grid tracks, lines, and areas.' },
                { id: 27, title: 'CSS Animations and Transitions', videoUrl: 'https://www.youtube.com/embed/zHUpx90NerM', transcript: 'Bring your websites to life with CSS animations and transitions. Learn about keyframes, timing functions, and transform properties.' }
            ]},
            { id: 3, categoryId: 2, title: 'Python for Beginners', description: 'A comprehensive introduction to Python programming, covering variables, loops, functions, and more.', thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 5, title: 'Getting Started with Python', videoUrl: 'https://www.youtube.com/embed/kqtD5dpn9C8', transcript: 'Install Python and write your first program. Understand the basics of Python syntax and how to run your code from the terminal.' },
                { id: 28, title: 'Python Variables and Data Types', videoUrl: 'https://www.youtube.com/embed/M2NyXKxyUTM', transcript: 'Explore Python\'s fundamental data types: integers, floats, strings, and booleans. Learn how to store data in variables.' },
                { id: 29, title: 'Python Functions and Loops', videoUrl: 'https://www.youtube.com/embed/9Os0o3wzS_I', transcript: 'Learn how to write reusable blocks of code with functions and how to iterate over data using for and while loops.' }
            ] },
            { id: 4, categoryId: 3, title: 'Data Analysis with Pandas', description: 'Learn to manipulate and analyze data efficiently using the powerful Pandas library in Python.', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 6, title: 'Pandas in 10 Minutes', videoUrl: 'https://www.youtube.com/embed/ZyhVh-qH9-w', transcript: 'A quick overview of the Pandas library, covering DataFrames, Series, and basic data manipulation techniques like selecting and filtering.' },
                { id: 30, title: 'Data Cleaning with Pandas', videoUrl: 'https://www.youtube.com/embed/bDhvCp3_lYw', transcript: 'Real-world data is messy. Learn how to handle missing values, correct data types, and remove duplicates to prepare your data for analysis.' },
                { id: 31, title: 'Data Visualization with Pandas', videoUrl: 'https://www.youtube.com/embed/a9UrKTVEeZA', transcript: 'Learn how to create basic plots and charts directly from your Pandas DataFrames to quickly gain insights from your data.' }
            ]},
            { id: 5, categoryId: 4, title: 'UI/UX Design Fundamentals', description: 'Discover the principles of user-centric design to create intuitive and beautiful interfaces.', thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 7, title: 'What is UX Design?', videoUrl: 'https://www.youtube.com/embed/z2_S0d_5_gY', transcript: 'Understand the core concepts of User Experience (UX) design and why it is crucial for creating successful products.' },
                { id: 34, title: 'UI Design Principles', videoUrl: 'https://www.youtube.com/embed/YiLUYf4HDh4', transcript: 'Explore fundamental User Interface (UI) design principles like contrast, repetition, alignment, and proximity to create visually appealing designs.' },
                { id: 35, title: 'User Research Methods', videoUrl: 'https://www.youtube.com/embed/Ovj4hFxko7c', transcript: 'Learn about different user research methods, such as interviews and surveys, to understand your users\' needs and pain points.' }
            ]},
            { id: 6, categoryId: 2, title: 'Java Masterclass', description: 'An in-depth course on Java for building robust, enterprise-scale applications.', thumbnail: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 8, title: 'Intro to Java', videoUrl: 'https://www.youtube.com/embed/grEKMHGYyns', transcript: 'Set up your Java development environment and write your first "Hello, World!" application. Understand the role of the JVM.' },
                { id: 32, title: 'Java Object-Oriented Programming', videoUrl: 'https://www.youtube.com/embed/Qgl81fPcLc8', transcript: 'Dive into the core principles of OOP in Java: encapsulation, inheritance, and polymorphism. Learn about classes and objects.' },
                { id: 33, title: 'Java Data Structures', videoUrl: 'https://www.youtube.com/embed/CBYHwZcbD-s', transcript: 'Explore common data structures in Java, such as Arrays, ArrayLists, and HashMaps, and learn when to use each one.' }
            ]},
            { id: 7, categoryId: 1, title: 'React Front to Back', description: 'Build and deploy modern, fast, and scalable web applications with React.js.', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 9, title: 'React JS Crash Course', videoUrl: 'https://www.youtube.com/embed/w7ejDZ8SWv8', transcript: 'Get up and running with React. Learn about JSX, components, and the virtual DOM in this fast-paced introduction.' },
                { id: 36, title: 'React Components and Props', videoUrl: 'https://www.youtube.com/embed/GIU8ekYndKw', transcript: 'Understand how to build reusable UI elements with React components and how to pass data down the component tree using props.' },
                { id: 37, title: 'React State and Events', videoUrl: 'https://www.youtube.com/embed/1FiIYaRr148', transcript: 'Learn how to manage component-level state with the useState hook and how to handle user interactions with event listeners.' }
            ]},
            { id: 8, categoryId: 3, title: 'Machine Learning A-Z', description: 'Learn complex theory, algorithms, and coding libraries in a simple way.', thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 10, title: 'What is Machine Learning?', videoUrl: 'https://www.youtube.com/embed/H9u_I37PnC4', transcript: 'An overview of machine learning, its different types (supervised, unsupervised), and its real-world applications.' },
                { id: 38, title: 'Python for Machine Learning', videoUrl: 'https://www.youtube.com/embed/7eh4d6sabA0', transcript: 'Learn about the essential Python libraries for machine learning, including NumPy, Pandas, and Scikit-learn.' },
                { id: 39, title: 'Linear Regression Explained', videoUrl: 'https://www.youtube.com/embed/nk2CQITm_eo', transcript: 'Understand one of the most fundamental machine learning algorithms, linear regression, and build your first predictive model.' }
            ]},
            { id: 9, categoryId: 4, title: 'Figma for UI Design', description: 'A complete guide to designing mobile and web apps with Figma, from basic tools to advanced prototyping.', thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 11, title: 'Introduction to Figma', videoUrl: 'https://www.youtube.com/embed/eZTMtj4mQ2g', transcript: 'A tour of the Figma interface. Learn about frames, shapes, and the basic tools you will use to create your designs.' },
                { id: 40, title: 'Creating Your First Design', videoUrl: 'https://www.youtube.com/embed/CDX7x3bVgtQ', transcript: 'Follow along as we design a simple mobile app screen, learning about layout grids, color styles, and text properties.' },
                { id: 41, title: 'Figma Prototyping Basics', videoUrl: 'https://www.youtube.com/embed/X5qiBwqptek', transcript: 'Bring your designs to life by creating interactive prototypes. Learn how to link screens together and add simple transitions.' }
            ]},
            { id: 10, categoryId: 2, title: 'Go (Golang) Programming', description: 'Learn the Go programming language from a complete beginner to an advanced developer.', thumbnail: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 12, title: 'Learn Go in 1 Hour', videoUrl: 'https://www.youtube.com/embed/YS4e4q9oBaU', transcript: 'A fast-paced introduction to the Go language, covering syntax, variables, data types, and control structures.' },
                { id: 42, title: 'Go Functions and Packages', videoUrl: 'https://www.youtube.com/embed/iUC-SAiFesk', transcript: 'Learn how to organize your Go code with packages and write modular, reusable functions.' },
                { id: 43, title: 'Go Concurrency with Goroutines', videoUrl: 'https://www.youtube.com/embed/LvgVSSpwND8', transcript: 'Explore Go\'s powerful and simple approach to concurrency using goroutines and channels.' }
            ]},
            { id: 11, categoryId: 3, title: 'SQL for Data Science', description: 'Master SQL, the core language for Big Data analysis, and work with databases like PostgreSQL.', thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 13, title: 'SQL Tutorial', videoUrl: 'https://www.youtube.com/embed/HXV3zeQKqGY', transcript: 'Learn the basics of SQL, including SELECT, FROM, WHERE, and ORDER BY clauses to query data from a database.' },
                { id: 44, title: 'Advanced SQL Queries', videoUrl: 'https://www.youtube.com/embed/BHwzDmr6d7s', transcript: 'Go beyond the basics with aggregate functions like COUNT, SUM, and AVG, and learn how to group data with GROUP BY.' },
                { id: 45, title: 'SQL Joins and Subqueries', videoUrl: 'https://www.youtube.com/embed/2HVMiPPuPIM', transcript: 'Master the art of combining data from multiple tables using different types of JOINs and learn how to use subqueries for complex lookups.' }
            ]},
            { id: 12, categoryId: 1, title: 'Node.js, Express, MongoDB', description: 'Build, test, and deploy real-world, production-ready backend applications using Node.js.', thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 14, title: 'Node.js Crash Course', videoUrl: 'https://www.youtube.com/embed/f2EqECiTBL8', transcript: 'Learn the fundamentals of Node.js and its asynchronous, event-driven architecture. Build a simple web server.' },
                { id: 46, title: 'Express.js Fundamentals', videoUrl: 'https://www.youtube.com/embed/L72fhGm1tfE', transcript: 'Build a REST API with Express.js, the most popular web framework for Node.js. Learn about routing and middleware.' },
                { id: 47, title: 'MongoDB with Node.js', videoUrl: 'https://www.youtube.com/embed/ofme2o29ngU', transcript: 'Connect your Node.js application to a MongoDB database. Learn how to perform CRUD (Create, Read, Update, Delete) operations.' }
            ]},
            { id: 13, categoryId: 2, title: 'C# Basics for Beginners', description: 'Learn the fundamentals of the C# language and the .NET framework.', thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 15, title: 'C# Tutorial For Beginners', videoUrl: 'https://www.youtube.com/embed/GhQdlIFylQ8', transcript: 'An introduction to C# and the .NET ecosystem. Learn about variables, data types, and basic control flow.' },
                { id: 48, title: 'C# Object-Oriented Programming', videoUrl: 'https://www.youtube.com/embed/O0MwOx9kJEA', transcript: 'Explore object-oriented programming concepts in C#, including classes, objects, inheritance, and interfaces.' },
                { id: 49, title: 'C# Collections and LINQ', videoUrl: 'https://www.youtube.com/embed/2DXTBBfRn-8', transcript: 'Learn to work with collections of data using C#\'s powerful Language-Integrated Query (LINQ) for querying and manipulation.' }
            ]},
            { id: 14, categoryId: 4, title: 'Adobe Illustrator for Beginners', description: 'Learn the essentials of Adobe Illustrator to create stunning vector graphics and illustrations.', thumbnail: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 16, title: 'Illustrator for Beginners', videoUrl: 'https://www.youtube.com/embed/Ib8o2_UraO0', transcript: 'Get familiar with the Adobe Illustrator workspace, artboards, and basic tools like the Pen tool and Shape Builder.' },
                { id: 50, title: 'Vector Graphics Fundamentals', videoUrl: 'https://www.youtube.com/embed/hT8ZGz8lVJo', transcript: 'Understand the difference between vector and raster graphics. Learn how to work with paths, strokes, and fills.' },
                { id: 51, title: 'Creating Logos in Illustrator', videoUrl: 'https://www.youtube.com/embed/cNPNs5bGbA8', transcript: 'A step-by-step guide to designing a professional logo from concept to final vector file.' }
            ]},
            { id: 15, categoryId: 3, title: 'Intro to TensorFlow for Deep Learning', description: 'Get started with Google\'s popular open-source machine learning framework, TensorFlow.', thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 17, title: 'TensorFlow in 100 Seconds', videoUrl: 'https://www.youtube.com/embed/_N5kpSMt4a4', transcript: 'A high-level overview of TensorFlow and its role in building and training deep learning models.' },
                { id: 52, title: 'Building Your First Neural Network', videoUrl: 'https://www.youtube.com/embed/aircAruvnKk', transcript: 'Use TensorFlow and Keras to build, compile, and train a simple neural network for a classification task.' },
                { id: 53, title: 'TensorFlow for Image Classification', videoUrl: 'https://www.youtube.com/embed/jztwpsIzEGc', transcript: 'Learn how to build a convolutional neural network (CNN) to classify images using the famous MNIST dataset.' }
            ]},
            { id: 16, categoryId: 1, title: 'Vue.js 3 Crash Course', description: 'Learn the fundamentals of Vue.js 3, the progressive JavaScript framework for building user interfaces.', thumbnail: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 18, title: 'Vue JS 3 Tutorial', videoUrl: 'https://www.youtube.com/embed/YrxBCBibVo0', transcript: 'A beginner\'s guide to Vue 3, covering the new Composition API, reactivity, and project setup with Vite.' },
                { id: 54, title: 'Vue.js Components', videoUrl: 'https://www.youtube.com/embed/VWnPBvPxUws', transcript: 'Learn how to create and register single-file components in Vue to build a modular and maintainable application.' },
                { id: 55, title: 'Vue.js State Management', videoUrl: 'https://www.youtube.com/embed/6vT8cCOzHco', transcript: 'An introduction to state management in Vue, exploring simple solutions and the official Pinia library.' }
            ]},
            { id: 17, categoryId: 2, title: 'Rust Programming Fundamentals', description: 'A beginner-friendly introduction to Rust, a language focused on performance, reliability, and productivity.', thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 19, title: 'Rust in 100 Seconds', videoUrl: 'https://www.youtube.com/embed/5C_HPTJg5ek', transcript: 'A quick look at what makes Rust unique, including its focus on memory safety without a garbage collector.' },
                { id: 56, title: 'Rust Ownership and Borrowing', videoUrl: 'https://www.youtube.com/embed/VFIOSWy93H0', transcript: 'Understand Rust\'s most unique feature: the ownership system, including the rules of borrowing and lifetimes.' },
                { id: 57, title: 'Rust Error Handling', videoUrl: 'https://www.youtube.com/embed/wM6o70NAWUI', transcript: 'Learn how Rust handles errors gracefully using the Result and Option enums, promoting robust and reliable code.' }
            ]},
            { id: 18, categoryId: 4, title: 'Blender 3.0 Beginner Tutorial', description: 'Learn 3D modeling, animation, and rendering from scratch with the powerful and free Blender software.', thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 20, title: 'Blender for Complete Beginners', videoUrl: 'https://www.youtube.com/embed/nIoXOplUvAw', transcript: 'A friendly introduction to the Blender interface, navigation, and basic object manipulation.' },
                { id: 58, title: 'Blender Modeling Basics', videoUrl: 'https://www.youtube.com/embed/9xAumJRKV6A', transcript: 'Learn the fundamentals of 3D modeling in Blender, including Edit Mode, vertices, edges, and faces.' },
                { id: 59, title: 'Blender Materials and Lighting', videoUrl: 'https://www.youtube.com/embed/eCGkWDz_5WU', transcript: 'Discover how to add materials, textures, and lighting to your 3D scenes to create realistic renders.' }
            ]},
            { id: 19, categoryId: 3, title: 'Introduction to R Programming', description: 'Learn the R programming language, the lingua franca of statistics and data science.', thumbnail: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 21, title: 'R Programming Tutorial', videoUrl: 'https://www.youtube.com/embed/_V8eKsto3Ug', transcript: 'Get started with R and RStudio. Learn basic syntax, variables, and how to use R as a powerful calculator.' },
                { id: 60, title: 'R Data Structures', videoUrl: 'https://www.youtube.com/embed/ANMuuq502rE', transcript: 'Explore R\'s primary data structures, including vectors, matrices, lists, and data frames.' },
                { id: 61, title: 'R for Statistical Analysis', videoUrl: 'https://www.youtube.com/embed/GAGUDL-4u5o', transcript: 'Learn how to perform basic statistical tests and analyses in R, a language built for statisticians.' }
            ]},
            { id: 20, categoryId: 1, title: 'Svelte for Beginners', description: 'Discover Svelte, the radical new approach to building user interfaces that compiles your code to tiny, framework-less vanilla JS.', thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 22, title: 'Svelte in 100 Seconds', videoUrl: 'https://www.youtube.com/embed/rv3Yq-B8qp4', transcript: 'A quick introduction to Svelte, the UI framework that is actually a compiler, resulting in highly efficient code.' },
                { id: 62, title: 'Svelte Components and Props', videoUrl: 'https://www.youtube.com/embed/043h4ugAj4c', transcript: 'Learn how to create components in Svelte and pass data to them using props.' },
                { id: 63, title: 'Svelte Stores and Reactivity', videoUrl: 'https://www.youtube.com/embed/4uB4_Oax-6A', transcript: 'Manage global state in your Svelte application with stores and understand its powerful, built-in reactivity system.' }
            ]},
            { id: 21, categoryId: 2, title: 'Kotlin for Android Development', description: 'Learn Kotlin, the official language for Android development, to build modern and robust mobile apps.', thumbnail: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 23, title: 'Kotlin Crash Course', videoUrl: 'https://www.youtube.com/embed/EExSSotojVI', transcript: 'A beginner\'s guide to Kotlin, covering variables, functions, classes, and null safety features.' },
                { id: 64, title: 'Android Development with Kotlin', videoUrl: 'https://www.youtube.com/embed/F9UC9DY-vIU', transcript: 'Build your first Android app using Kotlin and Android Studio. Learn about activities, layouts, and event handling.' },
                { id: 65, title: 'Kotlin Coroutines and Async', videoUrl: 'https://www.youtube.com/embed/BOHK_w09pVA', transcript: 'Learn how to handle asynchronous operations in Kotlin in a simple and efficient way using coroutines.' }
            ]},
            { id: 22, categoryId: 4, title: 'Canva for Beginners', description: 'Master Canva to create beautiful graphics for social media, presentations, and more, with no design experience required.', thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 24, title: 'How to Use Canva', videoUrl: 'https://www.youtube.com/embed/un5_s2_c2sI', transcript: 'A complete walkthrough of the Canva interface, templates, and design tools for non-designers.' },
                { id: 66, title: 'Canva Social Media Graphics', videoUrl: 'https://www.youtube.com/embed/F2xH8u6G3QE', transcript: 'Learn how to quickly create stunning graphics for Instagram, Facebook, and other social media platforms using Canva\'s templates.' },
                { id: 67, title: 'Canva Presentations and Documents', videoUrl: 'https://www.youtube.com/embed/x2xF-5_GFN8', transcript: 'Move beyond social media and learn how to create professional presentations, resumes, and documents in Canva.' }
            ]},
            { id: 23, categoryId: 3, title: 'Power BI Full Course', description: 'Learn how to use Power BI for data analysis and visualization to create stunning interactive reports and dashboards.', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&auto=format&q=80', creatorId: 2, status: 'published', lessons: [
                { id: 25, title: 'Power BI for Beginners', videoUrl: 'https://www.youtube.com/embed/TmhQCqAxrhg', transcript: 'Learn how to connect to data sources, transform data in the Power Query Editor, and build your first report in Power BI Desktop.' },
                { id: 68, title: 'Power BI Data Modeling', videoUrl: 'https://www.youtube.com/embed/gABmCUNwz8xI', transcript: 'Understand the fundamentals of data modeling in Power BI, including creating relationships between tables and writing basic DAX measures.' },
                { id: 69, title: 'Advanced Power BI Visualizations', videoUrl: 'https://www.youtube.com/embed/eYYDtKFDJu0', transcript: 'Explore advanced visualization techniques, custom visuals, and how to use bookmarks and tooltips to create interactive dashboards.' }
            ]},
        ],
        certificates: [],
        // --- Auth State ---
        firebase: {
            app: null,
            auth: null,
            db: null,
        },
        auth: {
            selectedRole: null,
            generatedOtp: null,
            userCredential: null,
            password: null, // To temporarily hold password for OTP re-authentication
        }
    },

    // --- INITIALIZATION ---
    init() {
        // Load data from localStorage
        this.loadFromStorage();
        
        // Initialize Firebase
        this.state.firebase.app = initializeApp(firebaseConfig);
        this.state.firebase.auth = getAuth(this.state.firebase.app);
        this.state.firebase.db = getFirestore(this.state.firebase.app);

        // Set up event listeners
        this.bindAuthEvents();
        document.getElementById('logout-button').addEventListener('click', this.logout.bind(this));
        document.getElementById('creator-apply-form').addEventListener('submit', this.handleCreatorApplication.bind(this));
        document.getElementById('create-course-btn').addEventListener('click', () => this.openCourseModal());
        document.getElementById('course-form').addEventListener('submit', this.handleCourseSave.bind(this));
        document.getElementById('lesson-form').addEventListener('submit', this.handleLessonSave.bind(this));

        // Listen for auth state changes to control the app flow
        onAuthStateChanged(this.state.firebase.auth, this.handleAuthStateChange.bind(this));
    },

    loadFromStorage() {
        // Load non-user-specific data
        const savedCourses = this.storage.load('courses');
        if (savedCourses && savedCourses.length > 0) {
            this.state.courses = savedCourses;
        }
        
        // Load certificates
        const savedCertificates = this.storage.load('certificates', []);
        this.state.certificates = savedCertificates;
        
        // Load categories
        const savedCategories = this.storage.load('categories');
        if (savedCategories && savedCategories.length > 0) {
            this.state.categories = savedCategories;
        }
    },

    saveToStorage() {
        // Save courses
        this.storage.save('courses', this.state.courses);
        
        // Save user-specific data, keyed by user ID for proper multi-user support
        if (this.state.currentUser && this.state.currentUser.uid) {
            this.storage.save(`userProgress_${this.state.currentUser.uid}`, this.state.currentUser.progress || {});
        }
        
        // Save certificates
        this.storage.save('certificates', this.state.certificates);
        
        // Save categories
        this.storage.save('categories', this.state.categories);
    },

    // --- AUTHENTICATION & NAVIGATION ---
    async handleAuthStateChange(user) {
        const loadingSpinner = document.getElementById('loading-spinner');
        const authContainer = document.getElementById('auth-view-container');
        loadingSpinner.classList.remove('hidden');
        authContainer.classList.add('hidden');

        if (user) {
            // User is signed in. Fetch their data.
            const userDocRef = doc(this.state.firebase.db, `artifacts/${appId}/users`, user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                this.state.currentUser = { uid: user.uid, email: user.email, ...userDoc.data() };
                // Load user-specific progress after user is authenticated
                const savedProgress = this.storage.load(`userProgress_${user.uid}`, {});
                this.state.currentUser.progress = savedProgress;

                this.state.currentRole = this.state.currentUser.role.toLowerCase();
                this.login();
            } else {
                console.error("User document not found in Firestore, but user is authenticated.");
                this.logout();
            }
        } else {
            // User is signed out - show role selection
            this.state.currentUser = null;
            this.state.currentRole = null;
            
            // Clear any auth state
            this.state.auth.selectedRole = null;
            this.state.auth.userCredential = null;
            this.state.auth.password = null;
            
            // Navigate to login view
            this.navigateTo('login-view');
            loadingSpinner.classList.add('hidden');
            authContainer.classList.remove('hidden');
            
            // Ensure we start with role selection
            this.switchAuthStep('role-selection-view');
        }
    },

    login() {
        document.getElementById('logout-button').classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `Welcome, ${this.state.currentUser.email}`;
        
        let route;
        switch(this.state.currentRole) {
            case 'learner':
                route = 'learner-dashboard';
                break;
            case 'creator':
                // In a real app, creator status would be part of the user document
                route = 'creator-dashboard-view'; // Simplified for now
                break;
            case 'admin':
                route = 'admin-dashboard-view';
                break;
            default:
                route = 'login-view';
        }
        this.navigateTo(route);
    },

    logout() {
        // Save current state before logout
        this.saveToStorage();
        
        // Clear Firebase auth state
        signOut(this.state.firebase.auth);
        
        // Clear current user state
        this.state.currentUser = null;
        this.state.currentRole = null;
        this.state.auth.selectedRole = null;
        this.state.auth.userCredential = null;
        this.state.auth.password = null;
        
        // Hide logout button and clear welcome message
        document.getElementById('logout-button').classList.add('hidden');
        document.getElementById('welcome-message').textContent = '';
        
        // Navigate to login view and show role selection
        this.navigateTo('login-view');
        
        // Ensure we're on the role selection step
        setTimeout(() => {
            this.switchAuthStep('role-selection-view');
        }, 100);
    },

    navigateTo(viewId, params = null) {
        try {
            // Save current state before navigation
            this.saveToStorage();
            
            if (Array.isArray(params)) {
                window.location.hash = `${viewId}/${params.join('/')}`;
            } else if (params) {
                window.location.hash = `${viewId}/${params}`;
            } else {
                window.location.hash = viewId;
            }
        } catch (error) {
            console.error('Error during navigation:', error);
        }
    },

    router() {
        const path = window.location.hash.slice(1) || 'login-view';
        const [viewId, ...params] = path.split('/');

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const activeView = document.getElementById(viewId) || document.getElementById('login-view');
        
        if (activeView) {
            // Role-based access control
            if (!this.state.currentRole && viewId !== 'login-view') {
                this.navigateTo('login-view');
                return; // The router will be called again after navigation
            }

            activeView.classList.add('active');
            
            // If navigating to login-view, ensure role selection is shown
            if (viewId === 'login-view') {
                setTimeout(() => {
                    this.switchAuthStep('role-selection-view');
                }, 50);
            }
            
            this.renderView(viewId, params);
        } else {
            const loginView = document.getElementById('login-view');
            loginView.classList.add('active');
            setTimeout(() => {
                this.switchAuthStep('role-selection-view');
            }, 50);
        }
    },

    start() {
        this.router();
        window.addEventListener('hashchange', this.router.bind(this));
    },

    renderView(viewId, params) {
        const param = params[0]; // Main parameter
        const pageParam = params.find(p => p.startsWith('page='));
        if (pageParam) {
            this.state.pagination.currentPage = parseInt(pageParam.split('=')[1]);
        } else {
            // If no page parameter, default to page 1
            this.state.pagination.currentPage = 1;
        }
        
        // Handle category parameter
        const categoryParam = params.find(p => p.startsWith('cat='));
        if (categoryParam) {
            this.state.activeCategoryId = parseInt(categoryParam.split('=')[1]);
        } else if (viewId === 'learner-dashboard') {
            // Default to 'all' for learner dashboard if no category specified
            this.state.activeCategoryId = 'all';
        }

        switch(viewId) {
            case 'learner-dashboard':
                this.renderLearnerDashboard();
                this.renderRoleHeaderActions();
                break;
            case 'learner-course-details':
                this.renderLearnerCourseDetails(parseInt(param));
                break;
            case 'learner-lesson-view':
                const [courseId, lessonId] = params[0].split('-').map(Number);
                this.renderLearnerLesson(courseId, lessonId);
                break;
            case 'learner-progress-view':
                this.renderLearnerProgressPage();
                break;
            case 'creator-apply-view':
                // Role-based access control: Only learners can apply
                if (this.state.currentRole !== 'learner') {
                    this.navigateTo('learner-dashboard'); // Or a generic home page
                    return;
                }
                this.renderCreatorApplyView();
                break;
            case 'creator-dashboard-view':
                this.renderCreatorDashboard();
                this.renderRoleHeaderActions();
                break;
            case 'admin-dashboard-view':
                this.renderAdminDashboard();
                this.renderRoleHeaderActions();
                break;
        }
    },
    
    // --- NEW AUTH FLOW METHODS ---
    bindAuthEvents() {
        document.getElementById('role-selection-view').addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this.state.auth.selectedRole = e.target.dataset.role;
                document.getElementById('role-display').textContent = this.state.auth.selectedRole;
                this.switchAuthStep('email-auth-view');
            }
        });

        document.getElementById('back-to-role').addEventListener('click', () => {
            this.switchAuthStep('role-selection-view');
        });

        document.getElementById('auth-form').addEventListener('submit', this.handleEmailAuth.bind(this));
        document.getElementById('otp-form').addEventListener('submit', this.handleOtpVerification.bind(this));
    },

    async handleEmailAuth(e) {
        e.preventDefault();
        this.hideAuthError('auth');
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        this.state.auth.password = password; // Store password
        const auth = this.state.firebase.auth;

        // --- Default Admin Login ---
        if (email === 'admin@mail.com' && password === 'admin123') {
            const selectedRole = this.state.auth.selectedRole;
            if (!selectedRole) {
                this.showAuthError('auth', 'Please go back and select a role first.');
                return;
            }
            // Find the default admin user and set their role based on selection
            const adminUser = this.state.users.find(u => u.email === 'admin@mail.com');
            if (adminUser) {
                this.state.currentUser = { ...adminUser, role: selectedRole.toLowerCase() };
                this.state.currentRole = selectedRole.toLowerCase();
            } else {
                this.showAuthError('auth', 'Default admin user not found.');
                return;
            }
            this.login();
            return; // Stop further execution
        }

        try {
            this.state.auth.userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.simulateOtpGenerationAndSend(email);
            this.switchAuthStep('otp-view');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                try {
                    this.state.auth.userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const newUser = {
                        uid: this.state.auth.userCredential.user.uid,
                        email: email,
                        role: this.state.auth.selectedRole.toLowerCase(),
                        progress: {}
                    };
                    // In a real app, this would be the only place you write to the DB.
                    // For our simulation, we also add to the local user list.
                    this.state.users.push(newUser);
                    const userDocRef = doc(this.state.firebase.db, `artifacts/${appId}/users`, newUser.uid);
                    await setDoc(userDocRef, { role: newUser.role, email: newUser.email, progress: {} });
                    
                    this.simulateOtpGenerationAndSend(email);
                    this.switchAuthStep('otp-view');
                } catch (createError) {
                    this.showAuthError('auth', createError.message);
                }
            } else {
                this.showAuthError('auth', error.message);
            }
        }
    },

    async handleOtpVerification(e) {
        e.preventDefault();
        this.hideAuthError('otp');
        const enteredOtp = document.getElementById('otp-input').value;

        if (enteredOtp === this.state.auth.generatedOtp) {
            try {
                await setPersistence(this.state.firebase.auth, browserLocalPersistence);
                // Re-authenticate to trigger onAuthStateChanged with persistence
                await signInWithEmailAndPassword(this.state.firebase.auth, this.state.auth.userCredential.user.email, this.state.auth.password);
                // The onAuthStateChanged listener will now handle the rest.
            } catch (persistenceError) {
                console.error("Error setting session persistence:", persistenceError);
                this.showAuthError('otp', 'Could not save your session. Please try again.');
            }
        } else {
            this.showAuthError('otp', 'Invalid OTP. Please try again.');
        }
    },

    simulateOtpGenerationAndSend(email) {
        this.state.auth.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpInfo = document.getElementById('otp-info');
        otpInfo.innerHTML = `(For demo purposes, your OTP is: <strong class="text-indigo-600">${this.state.auth.generatedOtp}</strong>. In a real app, this would be sent to ${email})`;
    },

    switchAuthStep(targetStepId) {
        // Ensure auth container is visible
        const authContainer = document.getElementById('auth-view-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        
        if (authContainer) {
            authContainer.classList.remove('hidden');
        }
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        // Switch auth steps
        document.querySelectorAll('.auth-step').forEach(step => {
            if (step.id === targetStepId) {
                step.classList.remove('hidden');
                step.style.display = 'flex';
            } else {
                step.classList.add('hidden');
                step.style.display = 'none';
            }
        });

        // Trigger GSAP animation for the new step
        if (window.animateAuthStep) window.animateAuthStep(targetStepId);
        
        // Clear any form data when going back to role selection
        if (targetStepId === 'role-selection-view') {
            const emailForm = document.getElementById('auth-form');
            const otpForm = document.getElementById('otp-form');
            if (emailForm) emailForm.reset();
            if (otpForm) otpForm.reset();
            
            // Clear any error messages
            this.hideAuthError('auth');
            this.hideAuthError('otp');
        }
    },

    showAuthError(view, message) {
        const errorEl = view === 'auth' 
            ? document.getElementById('error-message') 
            : document.getElementById('otp-error-message');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    },

    hideAuthError(view) {
        const errorEl = view === 'auth' 
            ? document.getElementById('error-message') 
            : document.getElementById('otp-error-message');
        errorEl.classList.add('hidden');
    },

    setCategoryFilter(categoryId) {
        this.state.activeCategoryId = categoryId;
        this.state.pagination.currentPage = 1; // Reset to first page on filter change
        
        // Navigate with category parameter
        const categoryParam = categoryId !== 'all' ? `cat=${categoryId}` : null;
        const params = ['page=1'];
        if (categoryParam) {
            params.push(categoryParam);
        }
        
        this.navigateTo('learner-dashboard', params);
    },

    // --- LEARNER VIEWS & LOGIC ---

    renderLearnerDashboard() {
        // Render Category Filters
        const filtersEl = document.getElementById('category-filters');
        filtersEl.innerHTML = '';
        
        // Create "All" button
        const allBtn = document.createElement('button');
        allBtn.className = `${this.state.activeCategoryId === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-full font-medium shadow-sm transition`;
        allBtn.textContent = 'All';
        allBtn.addEventListener('click', () => {
            this.setCategoryFilter('all');
        });
        filtersEl.appendChild(allBtn);
        
        // Create category buttons
        this.state.categories.forEach(cat => {
            const catBtn = document.createElement('button');
            catBtn.className = `${this.state.activeCategoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'} px-4 py-2 rounded-full font-medium shadow-sm transition`;
            catBtn.textContent = cat.name;
            catBtn.addEventListener('click', () => {
                this.setCategoryFilter(cat.id);
            });
            filtersEl.appendChild(catBtn);
        });

        // Filter and Render Courses
        const listEl = document.getElementById('learner-courses-list');
        listEl.innerHTML = '';
        
        let publishedCourses = this.state.courses.filter(c => c.status === 'published');
        if (this.state.activeCategoryId !== 'all') {
            publishedCourses = publishedCourses.filter(c => c.categoryId === this.state.activeCategoryId);
        }

        const totalPages = Math.ceil(publishedCourses.length / this.state.pagination.coursesPerPage);
        const startIndex = (this.state.pagination.currentPage - 1) * this.state.pagination.coursesPerPage;
        const endIndex = startIndex + this.state.pagination.coursesPerPage;
        const paginatedCourses = publishedCourses.slice(startIndex, endIndex);

        if (publishedCourses.length === 0) {
             listEl.innerHTML = '<p class="col-span-full text-center text-gray-500">No courses available in this category. Check back soon!</p>';
             this.renderPaginationControls(0);
             return;
        }

        paginatedCourses.forEach(course => {
            const template = document.getElementById('course-card-template').content.cloneNode(true);
            const imgEl = template.querySelector('.course-thumbnail');
            imgEl.src = course.thumbnail;
            // Enhanced fallback mechanism with multiple fallback images
            imgEl.onerror = function() {
                (`Primary image failed for course: ${course.title}`);
                // Try category-specific fallback images
                const fallbackImages = {
                    1: 'https://via.placeholder.com/600x400/3498db/ffffff?text=Web+Development', // Web Development
                    2: 'https://via.placeholder.com/600x400/2ecc71/ffffff?text=Programming', // Programming  
                    3: 'https://via.placeholder.com/600x400/e74c3c/ffffff?text=Data+Science', // Data Science
                    4: 'https://via.placeholder.com/600x400/f39c12/ffffff?text=Design' // Design
                };
                
                this.src = fallbackImages[course.categoryId] || 'https://via.placeholder.com/600x400/95a5a6/ffffff?text=Course';
                
                // If even the fallback fails, use a simple colored background
                this.onerror = function() {
                    (`Fallback image also failed for course: ${course.title}`);
                    this.style.backgroundColor = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'][course.categoryId - 1] || '#95a5a6';
                    this.style.display = 'flex';
                    this.style.alignItems = 'center';
                    this.style.justifyContent = 'center';
                    this.style.color = 'white';
                    this.style.fontSize = '18px';
                    this.style.fontWeight = 'bold';
                    this.style.textAlign = 'center';
                    this.alt = course.title;
                    this.onerror = null; // Prevent infinite loop
                };
            };
            
            template.querySelector('.course-title').textContent = course.title;
            template.querySelector('.course-description').textContent = course.description;
            const actionBtn = template.querySelector('.course-action-btn');
            actionBtn.textContent = 'View Course';
            actionBtn.addEventListener('click', () => {
                this.navigateTo('learner-course-details', course.id);
            });
            listEl.appendChild(template);
        });

        this.renderPaginationControls(totalPages);
    },

    renderPaginationControls(totalPages) {
        const controlsEl = document.getElementById('pagination-controls');
        controlsEl.innerHTML = '';
        if (totalPages <= 1) return;

        const currentPage = this.state.pagination.currentPage;
        
        // Ensure current page is within valid range
        if (currentPage > totalPages) {
            this.state.pagination.currentPage = totalPages;
            this.changePage(totalPages);
            return;
        }
        if (currentPage < 1) {
            this.state.pagination.currentPage = 1;
            this.changePage(1);
            return;
        }

        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'px-4 py-2 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            this.changePage(currentPage - 1);
        });
        controlsEl.appendChild(prevBtn);

        // Page Number Buttons
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            const activeClass = i === currentPage ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50';
            pageBtn.className = `px-4 py-2 rounded-md shadow-sm text-sm font-medium ${activeClass}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                this.changePage(i);
            });
            controlsEl.appendChild(pageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'px-4 py-2 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            this.changePage(currentPage + 1);
        });
        controlsEl.appendChild(nextBtn);
    },

    changePage(page) {
        // Update the current page state
        this.state.pagination.currentPage = page;
        
        // Get current category filter state and include it in navigation
        const categoryParam = this.state.activeCategoryId !== 'all' ? `cat=${this.state.activeCategoryId}` : null;
        const pageParam = `page=${page}`;
        
        const params = [pageParam];
        if (categoryParam) {
            params.push(categoryParam);
        }
        
        this.navigateTo('learner-dashboard', params);
    },

    renderLearnerCourseDetails(courseId) {
        const course = this.state.courses.find(c => c.id === courseId);
        const isEnrolled = this.state.currentUser.progress && this.state.currentUser.progress[courseId];
        const viewEl = document.getElementById('learner-course-details');
        const progress = this.calculateProgress(courseId);
        
        // Only generate lesson list if the user is enrolled
        let lessonListHtml = isEnrolled ? course.lessons.map((lesson, index) => {
            const isCompleted = this.state.currentUser.progress[courseId]?.includes(lesson.id);
            return `
                <li class="flex items-center justify-between p-3 rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}">
                    <span class="font-medium">${index + 1}. ${lesson.title}</span>
                    <button onclick="app.navigateTo('learner-lesson-view', '${courseId}-${lesson.id}')" class="bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600 transition text-sm">
                        ${isCompleted ? 'Review' : 'Start'}
                    </button>
                </li>
            `;
        }).join('') : '';

        // Determine what to show in the main content area
        let mainContentHtml;
        if (isEnrolled) {
            let actionButtonHtml = '';
            const certificate = this.state.certificates.find(c => c.courseId === courseId && c.learnerId === this.state.currentUser.uid);

            if (progress === 100) {
                if (certificate) {
                    actionButtonHtml = `<button onclick="app.showCertificate(${courseId})" class="w-full bg-yellow-400 text-yellow-900 py-3 rounded-lg hover:bg-yellow-500 transition text-lg font-semibold">View Certificate</button>`;
                } else {
                    actionButtonHtml = `<button onclick="app.issueCertificate(${courseId})" class="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition text-lg font-semibold">Claim Your Certificate</button>`;
                }
            }

             mainContentHtml = `
                 <div class="mt-6 mb-8">${actionButtonHtml}</div>
                 <h3 class="text-2xl font-bold mb-4">Lessons</h3>
                 <ul class="space-y-3">${lessonListHtml || '<p class="text-gray-500">No lessons in this course yet.</p>'}</ul>
             `;
        } else {
            mainContentHtml = `
                <button onclick="app.enrollInCourse(${courseId})" class="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition text-lg font-semibold">Enroll Now to Start Learning</button>
            `;
        }

        
        viewEl.innerHTML = `
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <button class="text-indigo-600 mb-6 hover:underline" onclick="app.navigateTo('learner-dashboard')">&larr; Back to Courses</button>
                <div class="md:flex md:space-x-8">
                    <img src="${course.thumbnail}" alt="${course.title}" class="w-full md:w-1/3 h-auto object-cover rounded-lg mb-4 md:mb-0">
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2">${course.title}</h2>
                        <p class="text-gray-600 mb-4">${course.description}</p>
                        <h3 class="text-xl font-semibold mb-3">Your Progress</h3>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                            <div class="bg-green-500 h-4 rounded-full" style="width: ${progress}%"></div>
                        </div>
                         <p class="text-center font-medium mb-6">${progress}% Complete</p>
                    </div>
                </div>
                <div class="mt-8">
                    ${mainContentHtml}
                </div>
            </div>
        `;
    },

    enrollInCourse(courseId) {
        if (!this.state.currentUser.progress[courseId]) {
            this.state.currentUser.progress[courseId] = []; // Initialize progress array for this course
            this.saveToStorage(); // Persist the enrollment
            this.renderLearnerCourseDetails(courseId); // Re-render the view to show lessons
        }
    },

    renderLearnerLesson(courseId, lessonId) {
        const course = this.state.courses.find(c => c.id === courseId);
        const lesson = course?.lessons.find(l => l.id === lessonId);
        const viewEl = document.getElementById('learner-lesson-view');
        const isCompleted = this.state.currentUser.progress[courseId]?.includes(lesson.id);
        const transcript = this.autoGenerateTranscript(lesson.title);
        
        viewEl.innerHTML = `
            <div class="bg-white p-8 rounded-xl shadow-lg">
                <button class="text-indigo-600 mb-6 hover:underline" onclick="app.navigateTo('learner-course-details', ${courseId})">&larr; Back to Course</button>
                <h2 class="text-3xl font-bold mb-4">${lesson?.title || 'Lesson Not Found'}</h2>
                <div class="relative w-full mb-6" style="padding-bottom: 56.25%; height: 0;">
                    <iframe src="${lesson.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute top-0 left-0 w-full h-full rounded-lg"></iframe>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2">
                        <h3 class="text-xl font-semibold mb-3">Auto-Generated Transcript</h3>
                        <div class="transcript-container h-64 overflow-y-auto bg-gray-100 p-4 rounded-lg border">
                            ${lesson.transcript || transcript}
                        </div>
                    </div>
                    <div>
                         <h3 class="text-xl font-semibold mb-3">Actions</h3>
                        <button id="complete-lesson-btn" onclick="app.markLessonComplete(${courseId}, ${lessonId})" class="w-full text-white py-3 rounded-lg transition ${isCompleted ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}">
                            ${isCompleted ? 'Completed' : 'Mark as Complete'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (isCompleted) {
            document.getElementById('complete-lesson-btn').disabled = true;
        }
    },

    markLessonComplete(courseId, lessonId) {
        if (!this.state.currentUser.progress[courseId]) {
            this.state.currentUser.progress[courseId] = [];
        }
        if (!this.state.currentUser.progress[courseId].includes(lessonId)) {
            this.state.currentUser.progress[courseId].push(lessonId);
        }
        
        // Save to localStorage
        this.saveToStorage();
        
        // Re-render lesson to update button state
        this.renderLearnerLesson(courseId, lessonId);
    },

    calculateProgress(courseId) {
        const course = this.state.courses.find(c => c.id === courseId);
        if (!course || course.lessons.length === 0) return 0;
        const completedLessons = this.state.currentUser.progress[courseId]?.length || 0;
        return Math.round((completedLessons / course.lessons.length) * 100);
    },

    issueCertificate(courseId) {
        const learnerId = this.state.currentUser.uid; // Use uid instead of id
        // Ensure no duplicate certificate
        if (this.state.certificates.some(c => c.courseId === courseId && c.learnerId === learnerId)) {
            return;
        }

        const cert = {
            learnerId,
            courseId,
            date: new Date().toLocaleDateString(),
            hash: 'CERT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        this.state.certificates.push(cert);
        
        // Save to localStorage
        this.saveToStorage();
        
        // Re-render the current view to update the button from "Claim" to "View"
        if (window.location.hash.includes('learner-course-details')) {
            this.renderLearnerCourseDetails(courseId);
        }
    },
    
    renderLearnerProgressPage() {
        const progressListEl = document.getElementById('progress-list');
        progressListEl.innerHTML = '';
        const enrolledCourses = this.state.courses.filter(c => Object.keys(this.state.currentUser.progress).map(Number).includes(c.id));
        
        if(enrolledCourses.length === 0) {
             progressListEl.innerHTML = '<p>You have not started any courses yet.</p>';
             return;
        }

        enrolledCourses.forEach(course => {
            const progress = this.calculateProgress(course.id);
            const certificate = this.state.certificates.find(c => c.courseId === course.id && c.learnerId === this.state.currentUser.uid); // Use uid

            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-4 rounded-lg border';
            div.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                         <h4 class="text-xl font-semibold">${course.title}</h4>
                         <p class="text-gray-600">Progress: ${progress}%</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        ${certificate ? `<button onclick="app.showCertificate(${course.id})" class="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition">View Certificate</button>` : ''}
                        <button onclick="app.navigateTo('learner-course-details', ${course.id})" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition ml-2">Continue Learning</button>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                    <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${progress}%"></div>
                </div>
            `;
            progressListEl.appendChild(div);
        });
    },
    
    renderRoleHeaderActions() {
        const userInfoEl = document.getElementById('user-info');
        // Clear existing buttons to prevent duplicates on re-render
        userInfoEl.querySelectorAll('.role-action-btn').forEach(btn => btn.remove());

        if (this.state.currentRole === 'learner') {
            // "My Progress" button
            if (!document.getElementById('progress-nav-btn')) {
                const progressBtn = document.createElement('button');
                progressBtn.id = 'progress-nav-btn';
                progressBtn.className = 'role-action-btn bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition';
                progressBtn.textContent = 'My Progress';
                progressBtn.onclick = () => this.navigateTo('learner-progress-view');
                userInfoEl.prepend(progressBtn);
            }
            // "Apply to be a Creator" button
            const applyBtn = document.createElement('button');
            applyBtn.id = 'creator-apply-nav-btn';
            applyBtn.className = 'role-action-btn bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition';
            applyBtn.textContent = 'Become a Creator';
            applyBtn.onclick = () => this.navigateTo('creator-apply-view');
            userInfoEl.prepend(applyBtn);
        } else if (this.state.currentRole === 'creator') {
            // "Learner View" button
            const learnerViewBtn = document.createElement('button');
            learnerViewBtn.id = 'learner-view-btn';
            learnerViewBtn.className = 'role-action-btn bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition';
            learnerViewBtn.textContent = 'Learner View';
            learnerViewBtn.onclick = () => this.navigateTo('learner-dashboard');
            userInfoEl.prepend(learnerViewBtn);
            // "Creator Dashboard" button
            const creatorDashBtn = document.createElement('button');
            creatorDashBtn.id = 'creator-dash-btn';
            creatorDashBtn.className = 'role-action-btn bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition';
            creatorDashBtn.textContent = 'Creator Dashboard';
            creatorDashBtn.onclick = () => this.navigateTo('creator-dashboard-view');
            userInfoEl.prepend(creatorDashBtn);
        } else if (this.state.currentRole === 'admin') {
            // "Learner View" button
            const learnerViewBtn = document.createElement('button');
            learnerViewBtn.id = 'learner-view-btn';
            learnerViewBtn.className = 'role-action-btn bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition';
            learnerViewBtn.textContent = 'Learner View';
            learnerViewBtn.onclick = () => this.navigateTo('learner-dashboard');
            userInfoEl.prepend(learnerViewBtn);
            // "Admin Dashboard" button
            const adminDashBtn = document.createElement('button');
            adminDashBtn.className = 'role-action-btn bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition';
            adminDashBtn.textContent = 'Admin Dashboard';
            adminDashBtn.onclick = () => this.navigateTo('admin-dashboard-view');
            userInfoEl.prepend(adminDashBtn);
        }
    },

    showCertificate(courseId) {
        const certificate = this.state.certificates.find(c => c.courseId === courseId && c.learnerId === this.state.currentUser.uid); // Use uid
        const course = this.state.courses.find(c => c.id === courseId);
        
        document.getElementById('cert-learner-name').textContent = this.state.currentUser.email; // Use email as name isn't stored
        document.getElementById('cert-course-name').textContent = course.title;
        document.getElementById('cert-date').textContent = certificate.date;
        document.getElementById('cert-hash').textContent = certificate.hash;

        this.openModal('certificate-modal');
    },


    // --- CREATOR VIEWS & LOGIC ---
    renderCreatorApplyView() {
        const statusEl = document.getElementById('creator-application-status');
        const formEl = document.getElementById('creator-apply-form');
        if(this.state.currentUser.status === 'pending') {
            statusEl.textContent = 'Your application is pending review.';
            statusEl.className = 'mt-6 text-center font-medium text-yellow-600';
            formEl.classList.add('hidden');
        } else {
            statusEl.textContent = '';
            formEl.classList.remove('hidden');
        }
    },

    async handleCreatorApplication(e) {
        e.preventDefault();
        const applicationData = {
            name: e.target.elements[0].value,
            expertise: e.target.elements[2].value,
            status: 'pending'
        };

        // Update the shared user object
        const userInDb = this.state.users.find(u => u.uid === this.state.currentUser.uid);
        if (userInDb) {
            userInDb.application = applicationData;
            this.state.currentUser.application = applicationData; // Update local state
            this.renderCreatorApplyView();
        }
    },
    
    renderCreatorDashboard() {
        const listEl = document.getElementById('creator-courses-list');
        listEl.innerHTML = '';
        const myCourses = this.state.courses.filter(c => c.creatorId === this.state.currentUser.uid); // Use uid

        if (myCourses.length === 0) {
            listEl.innerHTML = `<p class="text-center text-gray-500">You haven't created any courses yet. Click "Create New Course" to get started!</p>`;
            return;
        }

        myCourses.forEach(course => {
            const div = document.createElement('div');
            div.className = 'border p-4 rounded-lg mb-4';
            
            let lessonsHtml = course.lessons.length > 0
                ? `<ul class="space-y-2">${course.lessons.map(l => {
                    let transcriptStatus = '';
                    if (l.transcript === 'pending') {
                        transcriptStatus = `<span class="text-xs text-yellow-600 ml-2">(<svg class="animate-spin h-3 w-3 inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating Transcript...)</span>`;
                    } else if (l.transcript && l.transcript.startsWith('Error:')) {
                        transcriptStatus = `<span class="text-xs text-red-600 ml-2">(${l.transcript})</span>`;
                    } else if (l.transcript) {
                        transcriptStatus = `<button onclick="app.viewTranscript(${course.id}, ${l.id})" class="text-xs text-green-600 hover:underline ml-2">(View Transcript)</button>`;
                    }

                    return `
                        <li class="ml-4 list-disc flex justify-between items-center">
                            <div><span>${l.title}</span>${transcriptStatus}</div>
                            <button onclick="app.openLessonModal(${course.id}, ${l.id})" class="text-xs text-blue-600 hover:underline">edit</button>
                        </li>`;
                }).join('')}</ul>`
                : '<p class="text-sm text-gray-500">No lessons added yet.</p>';
            
            let statusBadge;
            switch (course.status) {
                case 'published': statusBadge = `<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Published</span>`; break;
                case 'pending': statusBadge = `<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Pending Review</span>`; break;
                case 'rejected': statusBadge = `<span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Rejected</span>`; break;
                default: statusBadge = '';
            }

            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-xl font-semibold">${course.title} ${statusBadge}</h4>
                        <p class="text-gray-600 mt-1">${course.description}</p>
                    </div>
                    <div class="flex space-x-2 flex-shrink-0">
                        <button onclick="app.openCourseModal(${course.id})" class="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200">Edit</button>
                        <button onclick="app.openLessonModal(${course.id})" class="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200">Add Lesson</button>
                        <button onclick="app.deleteCourse(${course.id})" class="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200">Delete</button>
                    </div>
                </div>
                <div class="mt-4">
                    <h5 class="font-semibold">Lessons:</h5>
                    ${lessonsHtml}
                </div>
            `;
            listEl.appendChild(div);
        });
    },
    
    openCourseModal(courseId = null) {
        const form = document.getElementById('course-form');
        form.reset();
        const titleEl = document.getElementById('course-modal-title');
        
        const categorySelect = document.getElementById('course-category-input');
        categorySelect.innerHTML = '<option value="" disabled selected>Select a Category</option>';
        this.state.categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });

        if (courseId) {
            const course = this.state.courses.find(c => c.id === courseId);
            titleEl.textContent = 'Edit Course';
            document.getElementById('course-id-input').value = course.id;
            document.getElementById('course-title-input').value = course.title;
            document.getElementById('course-description-input').value = course.description;
            document.getElementById('course-thumbnail-input').value = course.thumbnail;
            document.getElementById('course-category-input').value = course.categoryId;
        } else {
            titleEl.textContent = 'Create New Course';
        }
        this.openModal('course-modal');
    },

    handleCourseSave(e) {
        e.preventDefault();
        const id = document.getElementById('course-id-input').value;
        const newCourseData = {
            title: document.getElementById('course-title-input').value,
            description: document.getElementById('course-description-input').value,
            thumbnail: document.getElementById('course-thumbnail-input').value,
            categoryId: parseInt(document.getElementById('course-category-input').value),
        };

        if (id) { // Editing existing course
            const course = this.state.courses.find(c => c.id == id);
            Object.assign(course, newCourseData);
            course.status = 'pending'; // Re-submit for review on edit
        } else { // Creating new course
            const newCourse = {
                id: Date.now(),
                creatorId: this.state.currentUser.uid, // Use uid
                status: 'pending',
                lessons: [],
                ...newCourseData
            };
            this.state.courses.unshift(newCourse);
        }
        
        // Save to localStorage
        this.saveToStorage();
        
        this.closeModal('course-modal');
        this.renderCreatorDashboard();
    },
    
    deleteCourse(courseId) {
        if (confirm('Are you sure you want to delete this course and all its lessons?')) {
            this.state.courses = this.state.courses.filter(c => c.id !== courseId);
            this.saveToStorage(); // Persist the deletion
            this.renderCreatorDashboard();
        }
    },

    openLessonModal(courseId, lessonId = null) {
        const form = document.getElementById('lesson-form');
        form.reset();
        const modalTitle = document.querySelector('#lesson-modal h2');

        document.getElementById('lesson-course-id-input').value = courseId;

        if (lessonId) {
            // Editing an existing lesson
            modalTitle.textContent = 'Edit Lesson';
            const course = this.state.courses.find(c => c.id === courseId);
            const lesson = course.lessons.find(l => l.id === lessonId);
            document.getElementById('lesson-id-input').value = lesson.id;
            document.getElementById('lesson-title-input').value = lesson.title;
            document.getElementById('lesson-video-url-input').value = lesson.videoUrl;
            document.getElementById('lesson-transcript-input').value = lesson.transcript || '';
        } else {
            // Adding a new lesson
            modalTitle.textContent = 'Add New Lesson';
            document.getElementById('lesson-id-input').value = ''; // Ensure no ID is set
        }

        this.openModal('lesson-modal');
    },
    
    async handleLessonSave(e) {
        e.preventDefault();
        const courseId = parseInt(document.getElementById('lesson-course-id-input').value);
        const lessonId = document.getElementById('lesson-id-input').value ? parseInt(document.getElementById('lesson-id-input').value) : null;
        const course = this.state.courses.find(c => c.id == courseId);
        
        let lessonData = {
            title: document.getElementById('lesson-title-input').value,
            videoUrl: document.getElementById('lesson-video-url-input').value,
            transcript: document.getElementById('lesson-transcript-input').value, // Use manual transcript if provided
        };

        // If no manual transcript is provided, use the AI service.
        if (!lessonData.transcript) {
            lessonData.transcript = 'pending'; // Set status to pending
        }

        this.closeModal('lesson-modal');

        if (lessonId) {
            // Find and update the existing lesson
            const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
            if (lessonIndex > -1) {
                // Check if video URL changed to re-trigger transcription
                const oldVideoUrl = course.lessons[lessonIndex].videoUrl;
                if (lessonData.videoUrl !== oldVideoUrl && !document.getElementById('lesson-transcript-input').value) {
                    lessonData.transcript = 'pending';
                }
                course.lessons[lessonIndex] = { ...course.lessons[lessonIndex], ...lessonData };
            }
        } else {
            // Add a new lesson
            course.lessons.push({ id: Date.now(), ...lessonData });
        }
        this.renderCreatorDashboard();

        // After UI update, if transcript is pending, generate it.
        const lessonToTranscribe = course.lessons.find(l => l.transcript === 'pending');
        if (lessonToTranscribe) {
            try {
                const aiTranscript = await transcriptionService.generate(lessonToTranscribe.videoUrl, lessonToTranscribe.title);
                lessonToTranscribe.transcript = aiTranscript;
                this.saveToStorage(); // Save the updated transcript
            } catch (error) {
                console.error('AI Transcription failed:', error);
                lessonToTranscribe.transcript = 'Error: Transcription failed.'; // Update UI with error
            }
            this.renderCreatorDashboard(); // Re-render to show the final transcript status
        }
    },

    viewTranscript(courseId, lessonId) {
        const course = this.state.courses.find(c => c.id === courseId);
        const lesson = course.lessons.find(l => l.id === lessonId);
        const contentEl = document.getElementById('transcript-view-content');
        contentEl.textContent = lesson.transcript;
        this.openModal('transcript-view-modal');
    },

    // --- ADMIN VIEWS & LOGIC ---
    renderAdminDashboard() {
        this.renderCreatorApplications();
        this.renderCourseSubmissions();
    },

    renderCreatorApplications() {
        const reviewListEl = document.getElementById('admin-creator-review-list');
        reviewListEl.innerHTML = '';
        const pendingApps = this.state.users.filter(u => u.application && u.application.status === 'pending');

        if (pendingApps.length === 0) {
            reviewListEl.innerHTML = '<p class="text-center text-gray-500">No creator applications are currently pending review.</p>';
            return;
        }

        pendingApps.forEach(user => {
            const div = document.createElement('div');
            div.className = 'border p-4 rounded-lg';
            div.innerHTML = `
                <div>
                    <h4 class="text-lg font-semibold">${user.application.name} <span class="text-sm font-normal text-gray-500">(${user.email})</span></h4>
                    <p class="mt-2 text-gray-700"><strong>Expertise:</strong> ${user.application.expertise}</p>
                </div>
                <div class="mt-4 flex space-x-3">
                    <button onclick="app.updateCreatorStatus('${user.uid}', 'approved')" class="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition text-sm">Approve</button>
                    <button onclick="app.updateCreatorStatus('${user.uid}', 'rejected')" class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition text-sm">Reject</button>
                </div>
            `;
            reviewListEl.appendChild(div);
        });
    },

    updateCreatorStatus(userId, status) {
        const user = this.state.users.find(u => u.uid === userId);
        if (user) {
            user.application.status = status;
            if (status === 'approved') {
                user.role = 'creator'; // Promote user to creator
            }
            this.renderAdminDashboard();
        }
    },

    renderCourseSubmissions() {
        const reviewListEl = document.getElementById('admin-review-list');
        reviewListEl.innerHTML = '';
        const pendingCourses = this.state.courses.filter(c => c.status === 'pending');
        
        if (pendingCourses.length === 0) {
             reviewListEl.innerHTML = '<p class="text-center text-gray-500">No courses are currently pending review.</p>';
             return;
        }

        pendingCourses.forEach(course => {
             const creator = this.state.users.find(u => u.uid === course.creatorId);
             const category = this.state.categories.find(c => c.id === course.categoryId);
             const div = document.createElement('div');
             div.className = 'border p-4 rounded-lg';
             div.innerHTML = `
                <div>
                    <h4 class="text-lg font-semibold">${course.title}</h4>
                    <p class="text-sm text-gray-500">Submitted by: ${creator ? creator.email : 'Unknown'} | Category: ${category ? category.name : 'N/A'}</p>
                    <p class="mt-2">${course.description}</p>
                    <div class="mt-3">
                        <strong>Lessons (${course.lessons.length}):</strong>
                        <ul>${course.lessons.map(l => `<li class="text-sm ml-4 list-disc">${l.title}</li>`).join('')}</ul>
                    </div>
                </div>
                <div class="mt-4 flex space-x-3">
                    <button onclick="app.updateCourseStatus(${course.id}, 'published')" class="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition text-sm">Approve</button>
                    <button onclick="app.updateCourseStatus(${course.id}, 'rejected')" class="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition text-sm">Reject</button>
                </div>
             `;
             reviewListEl.appendChild(div);
        });
    },
    
    updateCourseStatus(courseId, status) {
        const course = this.state.courses.find(c => c.id === courseId);
        course.status = status;
        this.saveToStorage(); // Persist the status change
        this.renderAdminDashboard();
    },
    
    // --- UTILITIES ---
    openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        document.getElementById(modalId).classList.add('flex');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        document.getElementById(modalId).classList.remove('flex');
    },

    autoGenerateTranscript(seed) {
        const phrases = [
            "In this section, we will explore", "First, let's understand the core concepts of", "It's crucial to remember that",
            "As you can see on the screen,", "The next step involves", "To summarize what we've learned,", "This leads us to the topic of",
            "A common misconception is that", "Now, let's try a practical example.", "This is a fundamental building block for",
            "Pay close attention to this part,", "The key takeaway here is", "We need to consider the implications of",
        ];
        let transcript = `<p class="mb-2"><strong>00:01</strong> Welcome! Today we are discussing ${seed}.</p>`;
        for(let i = 0; i < 15; i++) {
            const time = (i * 15 + 10).toString().padStart(2, '0');
            const phrase = phrases[Math.floor(Math.random() * phrases.length)];
            transcript += `<p class="mb-2"><strong>00:${time}</strong> ${phrase} ${seed.toLowerCase().split(' ').pop()}.</p>`;
        }
        return transcript;
    }

};

// --- START APP ---
window.addEventListener('DOMContentLoaded', () => {
    try {
        app.init();
        app.start();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Make app globally available for onclick handlers
window.app = app;
