const express = require('express');
const path = require('path');
const compression = require('compression');
const enforce = require('express-sslify').HTTPS;

const app = express();
const PORT = process.env.PORT || 3000;

// Enable compression
app.use(compression());

// Enable HTTP to HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use(enforce({ trustProtoHeader: true }));
}

// Serve static files with caching headers
const oneYear = 31536000000; // 1 year in milliseconds
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: oneYear,
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // No cache for HTML files
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // Long cache for assets
      res.setHeader('Cache-Control', `public, max-age=${oneYear / 1000}, immutable`);
    }
  },
}));

// Serve index.html for all routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
