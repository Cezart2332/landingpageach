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
      
      // Update HTML file with cache busting and minified files
      updateHTML();
      
    } catch (error) {
      console.log('⚠️  Error processing JavaScript:', error.message);
      updateHTML();
    }
  })();
} else {
  updateHTML();
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
      js: jsFile
    }
  };
  
  fs.writeFileSync(path.join(__dirname, 'deploy-info.json'), JSON.stringify(deployInfo, null, 2));
  console.log('📝 Deployment info saved to deploy-info.json');
  
  if (useMinified) {
    console.log('\n🎉 Build complete! Minified files are ready for production.');
    console.log('📦 Files to deploy:');
    console.log('   - index.html');
    console.log('   - style.min.css');
    console.log('   - script.min.js');
    console.log('   - acoomh.png');
    console.log('   - acoomharta.mp4');
  } else {
    console.log('\n💡 Tip: Run "npm install" to enable CSS/JS minification for smaller file sizes.');
  }
}