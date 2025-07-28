#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import minification libraries
let CleanCSS, minify;
try {
  CleanCSS = require('clean-css');
  minify = require('terser').minify;
} catch (error) {
  console.log('⚠️  Minification dependencies not found. Run "npm install" to enable minification.');
  console.log('   Continuing with cache busting only...\n');
}

// Generate timestamp for cache busting
const timestamp = Date.now();

console.log('🚀 Starting build process...\n');

// Function to check if files exist
function checkRequiredFiles() {
  const requiredFiles = [
    'index.html',
    'rezervari.html',
    'restaurant.html',
    'rezervari-style.css',
    'rezervari-script.js',
    'restaurant-style.css',
    'restaurant-script.js',
    'acoomh.png',
    'acoomharta.mp4',
    'acoomharta_noaudio.mp4',
    'acoomharta_safe.mp4'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:');
    missingFiles.forEach(file => console.log(`   - ${file}`));
    console.log('\n⚠️  These files must be uploaded to your production server!\n');
  } else {
    console.log('✅ All required files present\n');
  }
  
  return missingFiles;
}

// Check files first
checkRequiredFiles();

// Function to minify CSS
function minifyCSS(cssContent) {
  if (!CleanCSS) return cssContent;
  
  const cleanCSS = new CleanCSS({
    level: 2,
    returnPromise: false
  });
  
  const result = cleanCSS.minify(cssContent);
  
  if (result.errors.length > 0) {
    console.log('⚠️  CSS minification warnings:', result.errors);
    return cssContent;
  }
  
  return result.styles;
}

// Function to minify JavaScript
async function minifyJS(jsContent) {
  if (!minify) return jsContent;
  
  try {
    const result = await minify(jsContent, {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        keep_fnames: true // Keep function names for debugging
      },
      format: {
        comments: false
      }
    });
    
    return result.code || jsContent;
  } catch (error) {
    console.log('⚠️  JavaScript minification error:', error.message);
    return jsContent;
  }
}

// Process CSS file
const cssPath = path.join(__dirname, 'style.css');
if (fs.existsSync(cssPath)) {
  try {
    const originalCSS = fs.readFileSync(cssPath, 'utf8');
    const minifiedCSS = minifyCSS(originalCSS);
    
    if (CleanCSS) {
      // Create minified version
      const minifiedPath = path.join(__dirname, 'style.min.css');
      fs.writeFileSync(minifiedPath, minifiedCSS);
      
      const originalSize = (originalCSS.length / 1024).toFixed(2);
      const minifiedSize = (minifiedCSS.length / 1024).toFixed(2);
      const savings = (((originalCSS.length - minifiedCSS.length) / originalCSS.length) * 100).toFixed(1);
      
      console.log(`✅ CSS minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
    }
  } catch (error) {
    console.log('⚠️  Error processing CSS:', error.message);
  }
}

// Process Rezervari CSS file
const rezervariCssPath = path.join(__dirname, 'rezervari-style.css');
if (fs.existsSync(rezervariCssPath)) {
  try {
    const originalCSS = fs.readFileSync(rezervariCssPath, 'utf8');
    const minifiedCSS = minifyCSS(originalCSS);
    
    if (CleanCSS) {
      // Create minified version
      const minifiedPath = path.join(__dirname, 'rezervari-style.min.css');
      fs.writeFileSync(minifiedPath, minifiedCSS);
      
      const originalSize = (originalCSS.length / 1024).toFixed(2);
      const minifiedSize = (minifiedCSS.length / 1024).toFixed(2);
      const savings = (((originalCSS.length - minifiedCSS.length) / originalCSS.length) * 100).toFixed(1);
      
      console.log(`✅ Rezervari CSS minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
    }
  } catch (error) {
    console.log('⚠️  Error processing Rezervari CSS:', error.message);
  }
}

// Process Restaurant CSS file
const restaurantCssPath = path.join(__dirname, 'restaurant-style.css');
if (fs.existsSync(restaurantCssPath)) {
  try {
    const originalCSS = fs.readFileSync(restaurantCssPath, 'utf8');
    const minifiedCSS = minifyCSS(originalCSS);
    
    if (CleanCSS) {
      // Create minified version
      const minifiedPath = path.join(__dirname, 'restaurant-style.min.css');
      fs.writeFileSync(minifiedPath, minifiedCSS);
      
      const originalSize = (originalCSS.length / 1024).toFixed(2);
      const minifiedSize = (minifiedCSS.length / 1024).toFixed(2);
      const savings = (((originalCSS.length - minifiedCSS.length) / originalCSS.length) * 100).toFixed(1);
      
      console.log(`✅ Restaurant CSS minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
    }
  } catch (error) {
    console.log('⚠️  Error processing Restaurant CSS:', error.message);
  }
}

// Process JavaScript file
const jsPath = path.join(__dirname, 'script.js');
if (fs.existsSync(jsPath)) {
  (async () => {
    try {
      const originalJS = fs.readFileSync(jsPath, 'utf8');
      const minifiedJS = await minifyJS(originalJS);
      
      if (minify && minifiedJS !== originalJS) {
        // Create minified version
        const minifiedPath = path.join(__dirname, 'script.min.js');
        fs.writeFileSync(minifiedPath, minifiedJS);
        
        const originalSize = (originalJS.length / 1024).toFixed(2);
        const minifiedSize = (minifiedJS.length / 1024).toFixed(2);
        const savings = (((originalJS.length - minifiedJS.length) / originalJS.length) * 100).toFixed(1);
        
        console.log(`✅ JavaScript minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
      }
      
      // Process Rezervari JavaScript file
      await processRezervariJS();
      
      // Process Restaurant JavaScript file
      await processRestaurantJS();
      
      // Update HTML files with cache busting and minified files
      updateHTML();
      
    } catch (error) {
      console.log('⚠️  Error processing JavaScript:', error.message);
      updateHTML();
    }
  })();
} else {
  updateHTML();
}

// Process Rezervari JavaScript file
async function processRezervariJS() {
  const rezervariJsPath = path.join(__dirname, 'rezervari-script.js');
  if (fs.existsSync(rezervariJsPath)) {
    try {
      const originalJS = fs.readFileSync(rezervariJsPath, 'utf8');
      const minifiedJS = await minifyJS(originalJS);
      
      if (minify && minifiedJS !== originalJS) {
        // Create minified version
        const minifiedPath = path.join(__dirname, 'rezervari-script.min.js');
        fs.writeFileSync(minifiedPath, minifiedJS);
        
        const originalSize = (originalJS.length / 1024).toFixed(2);
        const minifiedSize = (minifiedJS.length / 1024).toFixed(2);
        const savings = (((originalJS.length - minifiedJS.length) / originalJS.length) * 100).toFixed(1);
        
        console.log(`✅ Rezervari JavaScript minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
      }
    } catch (error) {
      console.log('⚠️  Error processing Rezervari JavaScript:', error.message);
    }
  }
}

// Process Restaurant JavaScript file
async function processRestaurantJS() {
  const restaurantJsPath = path.join(__dirname, 'restaurant-script.js');
  if (fs.existsSync(restaurantJsPath)) {
    try {
      const originalJS = fs.readFileSync(restaurantJsPath, 'utf8');
      const minifiedJS = await minifyJS(originalJS);
      
      if (minify && minifiedJS !== originalJS) {
        // Create minified version
        const minifiedPath = path.join(__dirname, 'restaurant-script.min.js');
        fs.writeFileSync(minifiedPath, minifiedJS);
        
        const originalSize = (originalJS.length / 1024).toFixed(2);
        const minifiedSize = (minifiedJS.length / 1024).toFixed(2);
        const savings = (((originalJS.length - minifiedJS.length) / originalJS.length) * 100).toFixed(1);
        
        console.log(`✅ Restaurant JavaScript minified: ${originalSize}KB → ${minifiedSize}KB (${savings}% smaller)`);
      }
    } catch (error) {
      console.log('⚠️  Error processing Restaurant JavaScript:', error.message);
    }
  }
}

function updateHTML() {
  // Read the index.html file
  const indexPath = path.join(__dirname, 'index.html');
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Use minified versions if they exist
  const useMinified = CleanCSS && minify;
  const cssFile = useMinified ? 'style.min.css' : 'style.css';
  const jsFile = useMinified ? 'script.min.js' : 'script.js';
  
  // Replace version parameters with current timestamp
  htmlContent = htmlContent.replace(/script(\.min)?\.js\?v=[^"]+/, `${jsFile}?v=${timestamp}`);
  htmlContent = htmlContent.replace(/style(\.min)?\.css\?v=[^"]+/, `${cssFile}?v=${timestamp}`);
  
  // Write back to index.html
  fs.writeFileSync(indexPath, htmlContent);
  
  // Update rezervari.html with cache busting
  const rezervariPath = path.join(__dirname, 'rezervari.html');
  if (fs.existsSync(rezervariPath)) {
    let rezervariContent = fs.readFileSync(rezervariPath, 'utf8');
    
    const rezervariCssFile = useMinified ? 'rezervari-style.min.css' : 'rezervari-style.css';
    const rezervariJsFile = useMinified ? 'rezervari-script.min.js' : 'rezervari-script.js';
    
    // Replace or add version parameters
    rezervariContent = rezervariContent.replace(/rezervari-style(\.min)?\.css(\?v=[^"]+)?/, `${rezervariCssFile}?v=${timestamp}`);
    rezervariContent = rezervariContent.replace(/rezervari-script(\.min)?\.js(\?v=[^"]+)?/, `${rezervariJsFile}?v=${timestamp}`);
    
    fs.writeFileSync(rezervariPath, rezervariContent);
    
    console.log(`   - ${rezervariCssFile}?v=${timestamp}`);
    console.log(`   - ${rezervariJsFile}?v=${timestamp}`);
  }
  
  // Update restaurant.html with cache busting
  const restaurantPath = path.join(__dirname, 'restaurant.html');
  if (fs.existsSync(restaurantPath)) {
    let restaurantContent = fs.readFileSync(restaurantPath, 'utf8');
    
    const restaurantCssFile = useMinified ? 'restaurant-style.min.css' : 'restaurant-style.css';
    const restaurantJsFile = useMinified ? 'restaurant-script.min.js' : 'restaurant-script.js';
    
    // Replace or add version parameters
    restaurantContent = restaurantContent.replace(/restaurant-style(\.min)?\.css(\?v=[^"]+)?/, `${restaurantCssFile}?v=${timestamp}`);
    restaurantContent = restaurantContent.replace(/restaurant-script(\.min)?\.js(\?v=[^"]+)?/, `${restaurantJsFile}?v=${timestamp}`);
    
    fs.writeFileSync(restaurantPath, restaurantContent);
    
    console.log(`   - ${restaurantCssFile}?v=${timestamp}`);
    console.log(`   - ${restaurantJsFile}?v=${timestamp}`);
  }
  
  console.log(`\n✅ Cache busting updated with timestamp: ${timestamp}`);
  console.log('📁 Files updated:');
  console.log(`   - ${jsFile}?v=${timestamp}`);
  console.log(`   - ${cssFile}?v=${timestamp}`);
  
  // Create a deployment info file
  const deployInfo = {
    timestamp: timestamp,
    date: new Date().toISOString(),
    minified: useMinified,
    files: {
      css: cssFile,
      js: jsFile,
      rezervariCss: useMinified ? 'rezervari-style.min.css' : 'rezervari-style.css',
      rezervariJs: useMinified ? 'rezervari-script.min.js' : 'rezervari-script.js',
      restaurantCss: useMinified ? 'restaurant-style.min.css' : 'restaurant-style.css',
      restaurantJs: useMinified ? 'restaurant-script.min.js' : 'restaurant-script.js'
    }
  };
  
  fs.writeFileSync(path.join(__dirname, 'deploy-info.json'), JSON.stringify(deployInfo, null, 2));
  console.log('📝 Deployment info saved to deploy-info.json');
  
  if (useMinified) {
    console.log('\n🎉 Build complete! Minified files are ready for production.');
    console.log('📦 Files to deploy to /var/www/acoomh/:');
    console.log('   - index.html');
    console.log('   - rezervari.html');
    console.log('   - restaurant.html');
    console.log('   - style.min.css');
    console.log('   - script.min.js');
    console.log('   - rezervari-style.min.css');
    console.log('   - rezervari-script.min.js');
    console.log('   - restaurant-style.min.css');
    console.log('   - restaurant-script.min.js');
    console.log('   - acoomh.png');
    console.log('   - acoomharta.mp4');
    console.log('   - acoomharta_noaudio.mp4  ⭐ CRITICAL FOR SAFARI!');
    console.log('   - acoomharta_safe.mp4');
    console.log('   - nginx.conf (update server config)');
    console.log('\n🔧 After uploading files:');
    console.log('   1. sudo nginx -t (test config)');
    console.log('   2. sudo systemctl reload nginx');
    console.log('   3. Check https://acoomh.ro/acoomharta_noaudio.mp4 directly');
    console.log('   4. Test rezervari page: https://acoomh.ro/rezervari.html');
  } else {
    console.log('\n💡 Tip: Run "npm install" to enable CSS/JS minification for smaller file sizes.');
    console.log('📦 Files to deploy (without minification):');
    console.log('   - index.html');
    console.log('   - rezervari.html');
    console.log('   - restaurant.html');
    console.log('   - style.css');
    console.log('   - script.js');
    console.log('   - rezervari-style.css');
    console.log('   - rezervari-script.js');
    console.log('   - restaurant-style.css');
    console.log('   - restaurant-script.js');
    console.log('   - acoomh.png');
    console.log('   - All video files');
  }
}