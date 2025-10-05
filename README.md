# MicroCourses - A Feature-Rich Mini LMS

A dynamic, single-page Learning Management System (LMS) built with modern vanilla JavaScript, Firebase, and Tailwind CSS. It simulates a complete learning platform with distinct roles for Learners, Creators, and Administrators, showcasing a wide range of features from course consumption to content creation and administrative oversight.

## 🚀 Features

### General
- **Single Page Application (SPA)**: Smooth, app-like experience with hash-based routing and no page reloads.
- **Role-Based Access Control**: Three distinct user roles (Learner, Creator, Admin) with unique dashboards and permissions.
- **Responsive Design**: A clean and modern UI built with Tailwind CSS that works seamlessly on all devices.
- **AI-Powered Help Desk**: An integrated chat widget that connects to a backend service (powered by Google's Gemini) to answer user questions.

### Authentication (Firebase)
- **Secure User Management**: Full email/password authentication (sign-up and sign-in) handled by Firebase Auth.
- **Simulated 2FA**: A demonstration of an OTP (One-Time Password) verification step for enhanced security.
- **Persistent Sessions**: Users remain logged in across browser sessions.

### Learner Features
- **Course Catalog**: Browse and filter a rich catalog of courses by category.
- **Paginated Content**: Easily navigate through a large number of courses.
- **Enrollment & Progress Tracking**: Enroll in courses, track lesson completion, and view overall progress.
- **Lesson Viewing**: Watch embedded video lessons.
- **AI-Generated Transcripts**: View high-quality, AI-generated transcripts for video lessons.
- **Certificate Generation**: Earn and view a unique, verifiable certificate upon course completion.

### Creator Features
- **Creator Application**: Learners can apply to become creators through a dedicated form.
- **Creator Dashboard**: A central hub to create, edit, and delete courses.
- **Course & Lesson Management**: Easily add and manage courses and their associated lessons.
- **AI Transcription Service**: Automatically generate and attach transcripts to video lessons via a simulated AI service.
- **Review Workflow**: Submit created courses for administrative review before they are published.

### Admin Features
- **Admin Dashboard**: A powerful interface for platform oversight.
- **Application Review**: Review and approve/reject applications from users wanting to become creators.
- **Course Moderation**: Review, approve (publish), or reject courses submitted by creators.

## 📁 Project Structure

```
MicroCourses/
├── index.html          # Main application file
├── script.js           # Core application logic and data
├── style.css           # Styling and layout
└── README.md           # This file
```

## 🎯 Getting Started

1. **Open the project**: Simply open `index.html` in your web browser
2. **Login**: Use any email/password combination with any role
   - Quick access: `admin@mail.com` / `admin123` for admin features
3. **Explore**: Browse courses, complete lessons, track progress

## 🛠️ Technology Stack

- **HTML5**: Semantic structure
- **CSS3**: Modern styling with custom components
- **JavaScript (ES6+)**: Core functionality
- **LocalStorage**: Data persistence

## 📚 Course Categories

- **Web Development**: HTML, CSS, JavaScript, React, Vue.js, Node.js
- **Programming**: Python, Java, Go, C#, Rust, Kotlin
- **Data Science**: SQL, R, Machine Learning, TensorFlow, Power BI
- **Design**: UI/UX, Figma, Illustrator, Blender, Canva

## ✨ Key Features

- **No Page Refreshes**: Single Page Application experience
- **Auto-Save**: Progress automatically saved to localStorage
- **Clean Login**: Simple authentication without complex external services
- **Certificate Generation**: Automatic certificates upon course completion
- **Responsive Design**: Works on all devices

## 🎨 Design Principles

- Clean, minimal interface
- No unnecessary UI elements
- Professional appearance
- Responsive across all devices
- Fast loading and smooth navigation

## 🔧 Recent Improvements

- **Simplified Authentication**: Removed complex Firebase/OTP verification
- **Removed Dependencies**: No longer requires GSAP or external libraries
- **Fixed Navigation**: Resolved login-to-dashboard navigation issues
- **Cleaned Codebase**: Removed unused files and simplified architecture

---

*Built with clean HTML/CSS/JS following modern web development best practices.*