# Development Guide

## Project Structure

```
src/
├── pages/           # HTML pages
│   ├── index.html
│   ├── roadmap.html
│   ├── progress.html
│   ├── chat.html
│   ├── skill.html
│   └── about.html
├── styles/
│   └── style.css    # Main stylesheet
├── scripts/
│   └── script.js    # Main JavaScript file
├── components/      # Reusable HTML components
├── utils/          # Utility functions
└── assets/         # Images, icons, fonts
```

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Or run build and serve separately
npm run build
npm run dev
```

### 2. File Organization

- **HTML**: All pages go in `src/pages/`
- **CSS**: Styles go in `src/styles/`
- **JavaScript**: Scripts go in `src/scripts/`
- **Assets**: Images and other static files go in `src/assets/`

### 3. Code Style

- Use 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Descriptive variable and function names
- Comment complex logic

### 4. Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ...

# Commit changes
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

## Firebase Configuration

### Environment Setup

1. Create a Firebase project
2. Enable Authentication, Realtime Database, and Hosting
3. Copy your config to `src/scripts/config.js`

### Config File Structure

```javascript
// src/scripts/config.js
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

export const FCM_VAPID_KEY = "your-vapid-key";
```

## Deployment

### Firebase Deployment

```bash
# Build for production
npm run build

# Deploy to Firebase
npm run deploy
```

### Manual Deployment

1. Build the project: `npm run build`
2. Upload `dist/` contents to your hosting provider
3. Configure Firebase service worker path

## Testing

### Manual Testing Checklist

- [ ] All pages load correctly
- [ ] User authentication works
- [ ] Roadmap navigation functions
- [ ] Chat system operates
- [ ] Progress tracking saves
- [ ] Responsive design on mobile
- [ ] Dark/light mode toggle works
- [ ] Search functionality filters correctly

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

1. **Firebase connection fails**
   - Check Firebase config
   - Verify project settings
   - Check network connectivity

2. **Styles not loading**
   - Run `npm run build`
   - Check file paths in HTML
   - Clear browser cache

3. **JavaScript errors**
   - Check browser console
   - Run `npm run lint`
   - Verify Firebase initialization

### Debug Mode

Add `?debug=true` to URL for additional logging.