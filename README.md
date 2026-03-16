# Cyber Roadmap Hub

A collaborative cybersecurity learning platform featuring structured roadmaps, realtime study chat, and progress tracking.

## 🚀 Features

- **Structured Learning Paths**: Comprehensive cybersecurity curriculum from fundamentals to advanced certifications
- **Progress Tracking**: Mark completed tasks and track your learning journey
- **Realtime Chat**: Connect with other learners for discussions and support
- **User Authentication**: Secure account system with Firebase
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between themes for comfortable learning
- **Search Functionality**: Quickly find specific skills in the roadmap
- **Push Notifications**: Stay updated with chat messages

## 📁 Project Structure

```
cyber-roadmap-platform/
├── src/                    # Source files
│   ├── pages/             # HTML pages
│   │   ├── index.html
│   │   ├── roadmap.html
│   │   ├── progress.html
│   │   ├── chat.html
│   │   ├── skill.html
│   │   └── about.html
│   ├── styles/            # CSS stylesheets
│   │   └── style.css
│   ├── scripts/           # JavaScript files
│   │   └── script.js
│   ├── components/        # Reusable HTML components
│   │   ├── header.html
│   │   └── footer.html
│   ├── utils/            # Utility functions
│   │   └── helpers.js
│   └── assets/           # Static assets
├── dist/                 # Built files for deployment
├── docs/                 # Documentation
│   └── development.md
├── functions/            # Firebase Cloud Functions
├── .eslintrc.json       # ESLint configuration
├── .gitignore          # Git ignore rules
├── build.js            # Build script
├── firebase.json       # Firebase configuration
├── package.json        # Node.js dependencies and scripts
└── README.md          # This file
```

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Realtime Database, Cloud Functions)
- **Deployment**: Firebase Hosting
- **Build Tools**: Node.js, npm scripts
- **Styling**: Custom CSS with CSS Variables for theming

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase CLI (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cyber-roadmap-platform.git
   cd cyber-roadmap-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication, Realtime Database, and Hosting
   - Copy your Firebase config to `src/scripts/config.js`
   - Update `firebase.json` with your project ID

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8000`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Watch for changes and rebuild
- `npm run deploy` - Deploy to Firebase
- `npm run lint` - Lint JavaScript files

## 🎯 Learning Roadmap

The platform includes a comprehensive cybersecurity curriculum covering:

### Fundamental IT Skills
- Computer Hardware Basics
- Networking Fundamentals
- Operating Systems
- Security Fundamentals

### Core Cybersecurity
- Cryptography
- Network Security
- Web Application Security
- Incident Response

### Advanced Topics
- Cloud Security
- Programming for Security
- Practice Platforms
- Professional Certifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various cybersecurity learning platforms
- Built with modern web technologies
- Community-driven content and improvements

## 📞 Support

If you have questions or need help:

- Open an issue on GitHub
- Join our Discord community
- Check the documentation in the `docs/` folder

---

**Happy Learning! 🛡️**