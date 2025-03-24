const fs = require('fs');
const path = require('path');

module.exports = function(app) {
  // API endpoint to list files in a directory
  app.get('/images/gallery', (req, res, next) => {
    if (req.query.listing === 'true') {
      try {
        const galleryDir = path.resolve(__dirname, '../public/images/gallery');
        
        // Read directory contents
        const files = fs.readdirSync(galleryDir);
        
        // Filter out hidden files (like .DS_Store)
        const visibleFiles = files.filter(file => !file.startsWith('.'));
        
        // Create full paths for each file
        const filePaths = visibleFiles.map(file => `/images/gallery/${file}`);
        
        res.json(filePaths);
      } catch (error) {
        console.error('Error listing gallery files:', error);
        res.status(500).json({ error: 'Failed to list gallery files' });
      }
    } else {
      // If not a listing request, continue to the next middleware
      next();
    }
  });
}; 