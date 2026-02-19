const fs = require('fs');
const path = require('path');

// Create a simple APK build script
console.log('Creating APK from exported bundle...');

// Copy the bundle to a location that can be used for APK creation
const sourceBundle = path.join(__dirname, 'dist/_expo/static/js/android/entry-1a330656272cc4c9fe27c8f2dde53bc6.hbc');
const outputDir = path.join(__dirname, 'apk-build');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy bundle to build directory
const bundleOutput = path.join(outputDir, 'index.android.bundle');
fs.copyFileSync(sourceBundle, bundleOutput);

// Copy assets
const assetsSource = path.join(__dirname, 'dist/_expo/assets');
const assetsOutput = path.join(outputDir, 'assets');
if (fs.existsSync(assetsSource)) {
  fs.cpSync(assetsSource, assetsOutput, { recursive: true });
}

console.log('Bundle and assets copied to:', outputDir);
console.log('To create APK, you need:');
console.log('1. Android Studio with proper Java version (Java 17 recommended)');
console.log('2. Or use online build service like EAS Build');
console.log('3. Or downgrade Java to version 17');
