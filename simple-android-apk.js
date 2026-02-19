const fs = require('fs');
const path = require('path');

console.log('🔨 Creating Simple Android APK...');

try {
  // Create a simple APK directory
  const simpleApkDir = path.join(__dirname, 'simple-android-apk');
  if (!fs.existsSync(simpleApkDir)) {
    fs.mkdirSync(simpleApkDir, { recursive: true });
  }
  
  // Copy the working bundle and assets
  const bundleSource = path.join(__dirname, 'zip-apk/index.android.bundle');
  const bundleDest = path.join(simpleApkDir, 'index.android.bundle');
  
  const assetsSource = path.join(__dirname, 'zip-apk/assets');
  const assetsDest = path.join(simpleApkDir, 'assets');
  
  if (fs.existsSync(bundleSource)) {
    if (!fs.existsSync(path.dirname(bundleDest))) {
      fs.mkdirSync(path.dirname(bundleDest), { recursive: true });
    }
    fs.copyFileSync(bundleSource, bundleDest);
    console.log('✅ Bundle copied');
  }
  
  if (fs.existsSync(assetsSource)) {
    if (!fs.existsSync(assetsDest)) {
      fs.mkdirSync(assetsDest, { recursive: true });
    }
    fs.cpSync(assetsSource, assetsDest, { recursive: true });
    console.log('✅ Assets copied');
  }
  
  // Create a simple manifest
  const simpleManifest = {
    name: 'CallBlocker',
    version: '1.0.0',
    bundle: 'index.android.bundle',
    assets: 'assets',
    created: new Date().toISOString(),
    instructions: `
📱 SIMPLE ANDROID PACKAGE
========================

This is a basic Android app package ready for manual APK creation.

📁 Contents:
- index.android.bundle (React Native bundle)
- assets/ (app resources)

🔧 To Create APK:
1. Use Android Studio: Import this folder as a project
2. Use online build service: EAS Build, AppCenter, etc.
3. Use Android build tools: aapt, gradle with proper setup

📊 Bundle Size: ${fs.existsSync(bundleDest) ? (fs.statSync(bundleDest).size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}

📍 Location: ${simpleApkDir}

⚠️  Note: This is NOT a signed APK. For production, sign the APK.
  `
  };
  
  fs.writeFileSync(path.join(simpleApkDir, 'package-info.txt'), simpleManifest.instructions);
  
  console.log('✅ Simple Android package created!');
  console.log('📍 Location:', simpleApkDir);
  console.log('📊 Bundle size:', fs.existsSync(bundleDest) ? (fs.statSync(bundleDest).size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A');
  console.log('\n📋 Instructions:');
  console.log(simpleManifest.instructions);
  
} catch (error) {
  console.error('❌ Package creation failed:', error.message);
}
