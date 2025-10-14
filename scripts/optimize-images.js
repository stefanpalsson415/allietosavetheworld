#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../public/family-photos');
const EARTH_IMAGE = path.join(__dirname, '../public/earth-image.jpg');
const OUTPUT_SIZES = {
  thumb: { width: 150, quality: 85 },
  small: { width: 400, quality: 85 },
  medium: { width: 800, quality: 85 },
  large: { width: 1200, quality: 90 }
};

// Function to optimize a single image
async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = '.jpg';
  
  console.log(`Optimizing ${filename}...`);
  
  // Create different sizes
  for (const [sizeName, config] of Object.entries(OUTPUT_SIZES)) {
    const outputPath = path.join(outputDir, `${filename}-${sizeName}${ext}`);
    
    try {
      await sharp(inputPath)
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({
          quality: config.quality,
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`  ✓ ${sizeName}: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (error) {
      console.error(`  ✗ Error creating ${sizeName}:`, error.message);
    }
  }
  
  // Also create a WebP version for modern browsers
  const webpPath = path.join(outputDir, `${filename}.webp`);
  try {
    await sharp(inputPath)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({
        quality: 85,
        effort: 6
      })
      .toFile(webpPath);
    
    const stats = fs.statSync(webpPath);
    console.log(`  ✓ WebP: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
  } catch (error) {
    console.error(`  ✗ Error creating WebP:`, error.message);
  }
}

// Main function
async function main() {
  console.log('Starting image optimization...\n');
  
  // Create optimized directory if it doesn't exist
  const optimizedDir = path.join(__dirname, '../public/family-photos/optimized');
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }
  
  // Optimize family photos
  const familyPhotos = fs.readdirSync(IMAGES_DIR).filter(file => 
    file.endsWith('.jpg') && !file.includes('-')
  );
  
  for (const photo of familyPhotos) {
    await optimizeImage(path.join(IMAGES_DIR, photo), optimizedDir);
  }
  
  // Optimize earth image
  console.log('\nOptimizing earth image...');
  const earthOptimizedDir = path.join(__dirname, '../public/optimized');
  if (!fs.existsSync(earthOptimizedDir)) {
    fs.mkdirSync(earthOptimizedDir, { recursive: true });
  }
  
  await optimizeImage(EARTH_IMAGE, earthOptimizedDir);
  
  console.log('\n✅ Image optimization complete!');
  
  // Generate image manifest
  const manifest = {
    familyPhotos: {},
    earthImage: {}
  };
  
  // Add family photos to manifest
  for (const photo of familyPhotos) {
    const name = path.basename(photo, '.jpg');
    manifest.familyPhotos[name] = {
      original: `/family-photos/${photo}`,
      thumb: `/family-photos/optimized/${name}-thumb.jpg`,
      small: `/family-photos/optimized/${name}-small.jpg`,
      medium: `/family-photos/optimized/${name}-medium.jpg`,
      large: `/family-photos/optimized/${name}-large.jpg`,
      webp: `/family-photos/optimized/${name}.webp`
    };
  }
  
  // Add earth image to manifest
  manifest.earthImage = {
    original: '/earth-image.jpg',
    thumb: '/optimized/earth-image-thumb.jpg',
    small: '/optimized/earth-image-small.jpg',
    medium: '/optimized/earth-image-medium.jpg',
    large: '/optimized/earth-image-large.jpg',
    webp: '/optimized/earth-image.webp'
  };
  
  // Write manifest
  fs.writeFileSync(
    path.join(__dirname, '../src/config/image-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('📄 Image manifest generated at src/config/image-manifest.json');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  main().catch(console.error);
} catch (e) {
  console.error('Please install sharp first: npm install sharp');
  process.exit(1);
}