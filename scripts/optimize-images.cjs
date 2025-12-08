const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
const outputDir = path.join(__dirname, '../assets-optimized');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImages() {
  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    const inputPath = path.join(assetsDir, file);
    const outputPath = path.join(outputDir, file.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
    
    const stats = fs.statSync(inputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`Processing ${file} (${sizeKB} KB)...`);
    
    try {
      // Get image dimensions
      const metadata = await sharp(inputPath).metadata();
      
      // Resize large images (max 512px for avatars, 1200px for cover)
      const isCover = file.toLowerCase().includes('cover');
      const maxDimension = isCover ? 1200 : 512;
      
      let pipeline = sharp(inputPath);
      
      if (metadata.width > maxDimension || metadata.height > maxDimension) {
        pipeline = pipeline.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Output as WebP with good quality
      await pipeline
        .webp({ quality: 80 })
        .toFile(outputPath);
      
      const newStats = fs.statSync(outputPath);
      const newSizeKB = (newStats.size / 1024).toFixed(2);
      const savings = (((stats.size - newStats.size) / stats.size) * 100).toFixed(1);
      
      console.log(`  → ${path.basename(outputPath)} (${newSizeKB} KB) - ${savings}% smaller`);
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\nDone! Optimized images are in assets-optimized/');
  console.log('Replace the assets folder with assets-optimized and update imports to use .webp');
}

optimizeImages();
