const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  console.log('Building Cyber Roadmap Platform...');

  // Create dist directory
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Copy HTML pages
  console.log('Copying HTML pages...');
  copyDir('src/pages', 'dist');

  // Copy assets
  if (fs.existsSync('src/assets')) {
    console.log('Copying assets...');
    copyDir('src/assets', 'dist');
  }

  // Copy Firebase service worker
  if (fs.existsSync('firebase-messaging-sw.js')) {
    console.log('Copying Firebase service worker...');
    fs.copyFileSync('firebase-messaging-sw.js', 'dist/firebase-messaging-sw.js');
  }

  // Process CSS
  console.log('Processing CSS...');
  const cssPath = 'src/styles/style.css';
  const cssDest = 'dist/style.css';

  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');

    // Update paths for dist
    css = css.replace(/href="style\.css"/g, 'href="style.css"');
    css = css.replace(/src="script\.js"/g, 'src="script.js"');

    fs.writeFileSync(cssDest, css);
  }

  // Process JavaScript
  console.log('Processing JavaScript...');
  const jsPath = 'src/scripts/script.js';
  const jsDest = 'dist/script.js';

  if (fs.existsSync(jsPath)) {
    let js = fs.readFileSync(jsPath, 'utf8');

    // Update paths for dist
    js = js.replace(/href="style\.css"/g, 'href="style.css"');

    fs.writeFileSync(jsDest, js);
  }

  console.log('Build completed successfully!');
  console.log('Output directory: dist/');
}

if (require.main === module) {
  build();
}

module.exports = { build };