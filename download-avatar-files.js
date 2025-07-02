const https = require('https');
const fs = require('fs');

const avatarFiles = [
  'https://reallyavatar.com:5173/src/App.jsx',
  'https://reallyavatar.com:5173/src/components/Avatar.jsx',
  'https://reallyavatar.com:5173/src/components/Experience.jsx',
  'https://reallyavatar.com:5173/src/components/UI.jsx',
  'https://reallyavatar.com:5173/src/hooks/useChat.jsx',
  'https://reallyavatar.com:5173/src/hooks/useSpeechRecognitionHook.jsx'
];

const downloadFile = (url, filename) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(filename, data);
        console.log(`✅ Downloaded: ${filename}`);
        resolve(data);
      });
    }).on('error', reject);
  });
};

async function downloadAvatarFiles() {
  console.log('🚀 Downloading Avatar Implementation Files...\n');
  
  if (!fs.existsSync('avatar-files')) {
    fs.mkdirSync('avatar-files');
  }

  for (const url of avatarFiles) {
    try {
      const filename = `avatar-files/${url.split('/').pop()}`;
      await downloadFile(url, filename);
    } catch (error) {
      console.log(`❌ Failed to download ${url}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Download complete! Files saved in ./avatar-files/');
}

downloadAvatarFiles().catch(console.error);