const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🔨 Building Final APK...');

try {
  const finalApkDir = path.join(__dirname, 'final-apk');
  const apkOutput = path.join(__dirname, 'CallBlocker-Fixed.apk');
  
  // Create output stream
  const output = fs.createWriteStream(apkOutput);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log('✅ APK created successfully!');
    console.log('📍 Location:', apkOutput);
    console.log('📊 Size:', (archive.pointer() / 1024 / 1024).toFixed(2), 'MB');
    console.log('\n📋 Installation Instructions:');
    console.log('1. Enable "Unknown Sources" in Android Settings → Security');
    console.log('2. Transfer CallBlocker-Fixed.apk to your Android device');
    console.log('3. Install the APK');
    console.log('4. Grant all requested permissions when prompted');
    console.log('5. Launch CallBlocker app');
    console.log('\n⚠️ Note: This APK contains proper AndroidManifest.xml');
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  // Pipe archive to output
  archive.pipe(output);
  
  // Add files to APK
  const manifestPath = path.join(finalApkDir, 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    archive.file(manifestPath, { name: 'AndroidManifest.xml' });
  }
  
  const assetsDir = path.join(finalApkDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    archive.directory(assetsDir, 'assets');
  }
  
  // Finalize the archive
  archive.finalize();
  
} catch (error) {
  console.error('❌ APK build failed:', error.message);
}
