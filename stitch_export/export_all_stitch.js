const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public', 'stitch');
const targetDir = 'C:\\Users\\User\\Desktop\\Stitch_C8L_Design';

console.log('--- STARTING STITCH SCREEN EXPORT ---');
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

if (!fs.existsSync(sourceDir)) {
  console.error(`Error: Source directory ${sourceDir} does not exist.`);
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created target directory: ${targetDir}`);
}

try {
  const files = fs.readdirSync(sourceDir);
  let count = 0;
  
  for (const file of files) {
    const srcPath = path.join(sourceDir, file);
    const destPath = path.join(targetDir, file);
    
    // Copy HTML files and images
    if (file.endsWith('.html') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[+] Exported: ${file}`);
      count++;
    }
  }
  
  console.log(`\nSuccess: Successfully exported ${count} screen files to Desktop/Stitch_C8L_Design!`);
} catch (err) {
  console.error(`Error during export: ${err.message}`);
}
