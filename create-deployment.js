// create-deployment.js
const fs = require('fs');
const path = require('path');

const filesToCopy = [
  '.next',
  'public',
  'package.json',
  'package-lock.json',
  'next.config.js',
  'ecosystem.config.js',
  '.env.production'
];

const deployDir = 'deploy';

// Create deploy directory
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

console.log('Creating deployment package...');

filesToCopy.forEach(file => {
  const source = path.join(__dirname, file);
  const destination = path.join(__dirname, deployDir, file);
  
  if (fs.existsSync(source)) {
    if (fs.lstatSync(source).isDirectory()) {
      fs.cpSync(source, destination, { recursive: true });
      console.log(`✓ Copied ${file}/`);
    } else {
      fs.copyFileSync(source, destination);
      console.log(`✓ Copied ${file}`);
    }
  } else {
    console.log(`⚠ Skipped ${file} (not found)`);
  }
});

console.log('\nDeployment package created in ./deploy folder');
console.log('Now zip this folder and upload to your server');