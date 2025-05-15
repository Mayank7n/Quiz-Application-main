const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Run the standard build
console.log('Starting production build...');
execSync('react-scripts build', { stdio: 'inherit' });

console.log('Build complete. Optimizing assets...');

// Configure Brotli and Gzip compression
const compressFiles = async (files, format) => {
  const zlib = require('zlib');
  const { promisify } = require('util');
  const gzip = promisify(zlib.gzip);
  const brotli = promisify(zlib.brotliCompress);
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file);
      
      if (format === 'gzip' || format === 'all') {
        const gzipped = await gzip(content);
        fs.writeFileSync(`${file}.gz`, gzipped);
      }
      
      if (format === 'br' || format === 'all') {
        const compressed = await brotli(content);
        fs.writeFileSync(`${file}.br`, compressed);
      }
    } catch (err) {
      console.error(`Error compressing ${file}:`, err.message);
    }
  }
};

// Get all JS and CSS files in the build directory
const getFiles = (dir, ext) => {
  const files = [];
  
  const walk = (dir) => {
    const items = fs.readdirSync(dir);
    
    items.forEach((item) => {
      try {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (ext.some(e => fullPath.endsWith(e))) {
          files.push(fullPath);
        }
      } catch (err) {
        console.error(`Error processing ${item}:`, err.message);
      }
    });
  };
  
  walk(dir);
  return files;
};

const buildDir = path.join(__dirname, '..', 'build');
const files = getFiles(buildDir, ['.js', '.css', '.html', '.json']);

console.log(`Optimizing ${files.length} files...`);

// Compress files
compressFiles(files, 'all')
  .then(() => {
    console.log('Optimization complete!');
    
    // Print build size info
    try {
      const assetManifest = require(path.join(buildDir, 'asset-manifest.json'));
      console.log('\nBuild size analysis:');
      
      if (assetManifest.files) {
        Object.entries(assetManifest.files).forEach(([file, path]) => {
          if (path.endsWith('.js') || path.endsWith('.css')) {
            const filePath = path.join(buildDir, path);
            try {
              const stats = fs.statSync(filePath);
              console.log(`${file}: ${(stats.size / 1024).toFixed(2)} KB`);
            } catch (err) {
              console.error(`Could not get size for ${file}:`, err.message);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error analyzing build size:', err.message);
    }
  })
  .catch((err) => {
    console.error('Error during optimization:', err);
    process.exit(1);
  });
