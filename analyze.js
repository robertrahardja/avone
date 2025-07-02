const puppeteer = require('puppeteer');

async function analyzeReallyLesson() {
  console.log('🚀 Starting ReallyLesson Tech Stack Analysis...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  try {
    // Collect all network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    console.log('📱 Navigating to https://reallylesson.com...');
    await page.goto('https://reallylesson.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('✅ Page loaded successfully!\n');

    // Check for JavaScript frameworks
    console.log('🔍 Detecting JavaScript Frameworks...');
    const frameworks = await page.evaluate(() => {
      const detected = [];

      if (window.React || document.querySelector('[data-reactroot]')) {
        detected.push('React');
      }
      if (window.Vue || document.querySelector('[data-v-]')) {
        detected.push('Vue.js');
      }
      if (window.angular || window.ng || document.querySelector('[ng-]')) {
        detected.push('Angular');
      }
      if (window.jQuery || window.$) {
        detected.push('jQuery');
      }
      if (window.__NEXT_DATA__) {
        detected.push('Next.js');
      }
      if (window.__NUXT__) {
        detected.push('Nuxt.js');
      }

      return detected;
    });

    console.log('📋 JavaScript Frameworks:', frameworks.length ? frameworks.join(', ') : 'None detected in window object');

    // Check for avatar/3D technologies
    console.log('\n🤖 Detecting Avatar/3D Technologies...');
    const avatarTech = await page.evaluate(() => {
      const detected = [];

      if (window.THREE) detected.push('Three.js');
      if (window.BABYLON) detected.push('Babylon.js');
      if (window.ReallyBot) detected.push('ReallyBot');
      if (window.Avatar) detected.push('Avatar API');

      // Check for WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) detected.push('WebGL Support');

      // Count canvas elements
      const canvasElements = document.querySelectorAll('canvas');
      if (canvasElements.length > 0) {
        detected.push(`${canvasElements.length} Canvas element(s)`);
      }

      return detected;
    });

    console.log('🎭 Avatar/3D Technologies:', avatarTech.length ? avatarTech.join(', ') : 'None detected');

    // Analyze network requests
    console.log('\n🌐 Analyzing Network Requests...');
    const jsFiles = requests.filter(r => r.resourceType === 'script' && r.url.includes('.js'));
    const cssFiles = requests.filter(r => r.resourceType === 'stylesheet');
    const apiCalls = requests.filter(r => r.url.includes('/api/') || r.url.includes('/graphql'));

    console.log(`📜 JavaScript files loaded: ${jsFiles.length}`);
    if (jsFiles.length > 0) {
      console.log('   All JS files:');
      jsFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.url}`);
      });
    }

    // Download and analyze JS files for avatar-related code
    console.log('\n🔍 Analyzing JS files for avatar functionality...');
    const fs = require('fs');
    const https = require('https');
    const http = require('http');
    
    const downloadFile = (url) => {
      return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        client.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
    };

    const avatarKeywords = ['avatar', 'bot', 'speech', 'tts', 'voice', 'ai', 'chat', 'canvas', 'webgl', 'three', 'babylon', 'animation', 'model', 'render'];
    
    for (let i = 0; i < Math.min(jsFiles.length, 10); i++) {
      const file = jsFiles[i];
      try {
        console.log(`\n📄 Analyzing: ${file.url.split('/').pop()}`);
        const content = await downloadFile(file.url);
        
        // Look for avatar-related keywords
        const foundKeywords = avatarKeywords.filter(keyword => 
          content.toLowerCase().includes(keyword)
        );
        
        if (foundKeywords.length > 0) {
          console.log(`   🎯 Found keywords: ${foundKeywords.join(', ')}`);
          
          // Extract relevant code snippets
          const lines = content.split('\n');
          const relevantLines = [];
          
          lines.forEach((line, index) => {
            if (foundKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
              relevantLines.push(`   ${index + 1}: ${line.trim()}`);
            }
          });
          
          if (relevantLines.length > 0) {
            console.log('   📝 Relevant code snippets:');
            relevantLines.slice(0, 10).forEach(line => console.log(line));
            if (relevantLines.length > 10) {
              console.log(`   ... and ${relevantLines.length - 10} more lines`);
            }
          }
        } else {
          console.log('   ❌ No avatar-related keywords found');
        }
      } catch (error) {
        console.log(`   ⚠️ Could not analyze: ${error.message}`);
      }
    }

    console.log(`\n🎨 CSS files loaded: ${cssFiles.length}`);
    if (cssFiles.length > 0) {
      cssFiles.slice(0, 3).forEach(file => {
        console.log(`   - ${file.url}`);
      });
    }

    console.log(`\n🔌 API calls detected: ${apiCalls.length}`);
    if (apiCalls.length > 0) {
      apiCalls.slice(0, 3).forEach(api => {
        console.log(`   - ${api.method} ${api.url}`);
      });
    }

    // Check script content for frameworks
    console.log('\n📦 Analyzing Script Content...');
    const scriptAnalysis = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const detected = new Set();

      scripts.forEach(script => {
        const src = (script.src || '').toLowerCase();
        const content = (script.textContent || '').toLowerCase();

        // Check URLs
        if (src.includes('react')) detected.add('React (from CDN)');
        if (src.includes('vue')) detected.add('Vue.js (from CDN)');
        if (src.includes('angular')) detected.add('Angular (from CDN)');
        if (src.includes('three')) detected.add('Three.js (from CDN)');
        if (src.includes('bootstrap')) detected.add('Bootstrap (from CDN)');

        // Check content (first 1000 chars to avoid performance issues)
        const snippet = content.substring(0, 1000);
        if (snippet.includes('react') && snippet.includes('component')) detected.add('React (bundled)');
        if (snippet.includes('vue') && snippet.includes('createapp')) detected.add('Vue.js (bundled)');
        if (snippet.includes('reallybot')) detected.add('ReallyBot code detected');
        if (snippet.includes('avatar')) detected.add('Avatar-related code');
        if (snippet.includes('webgl') || snippet.includes('three')) detected.add('3D/WebGL code');
      });

      return Array.from(detected);
    });

    console.log('📚 Technologies in scripts:', scriptAnalysis.length ? scriptAnalysis.join(', ') : 'None detected');

    // Check meta tags
    console.log('\n📋 Checking Meta Information...');
    const metaInfo = await page.evaluate(() => {
      const meta = {};

      const generator = document.querySelector('meta[name="generator"]');
      if (generator) meta.generator = generator.content;

      const powered = document.querySelector('meta[name="powered-by"]');
      if (powered) meta.powered = powered.content;

      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) meta.viewport = viewport.content;

      return meta;
    });

    Object.entries(metaInfo).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Try LMS subdomain
    console.log('\n🎓 Checking LMS subdomain (lms.reallylesson.com)...');
    try {
      await page.goto('https://lms.reallylesson.com', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      const lmsTitle = await page.title();
      console.log(`📚 LMS Page Title: ${lmsTitle}`);

      const lmsTech = await page.evaluate(() => {
        const detected = [];
        if (window.React) detected.push('React');
        if (window.Vue) detected.push('Vue.js');
        if (window.angular) detected.push('Angular');
        if (window.jQuery) detected.push('jQuery');
        return detected;
      });

      console.log('🔧 LMS Technologies:', lmsTech.length ? lmsTech.join(', ') : 'None detected');

    } catch (error) {
      console.log('❌ Could not access LMS subdomain:', error.message);
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Analysis complete!');
  }
}

analyzeReallyLesson().catch(console.error);
