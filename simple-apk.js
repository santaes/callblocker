const fs = require('fs');
const path = require('path');

console.log('📱 Creating Simple APK Package...');

// Create a simple APK-like package
const apkDir = path.join(__dirname, 'simple-apk');
if (!fs.existsSync(apkDir)) {
  fs.mkdirSync(apkDir, { recursive: true });
}

// Copy the exported bundle
const bundleSource = path.join(__dirname, 'dist/_expo/static/js/android/entry-1a330656272cc4c9fe27c8f2dde53bc6.hbc');
const bundleDest = path.join(apkDir, 'index.android.bundle');
fs.copyFileSync(bundleSource, bundleDest);

// Copy assets
const assetsSource = path.join(__dirname, 'dist/_expo/assets');
const assetsDest = path.join(apkDir, 'assets');
if (fs.existsSync(assetsSource)) {
  fs.cpSync(assetsSource, assetsDest, { recursive: true });
}

// Create a simple manifest
const manifest = {
  name: 'CallBlocker',
  version: '1.0.0',
  description: 'Call blocking application',
  main: 'index.android.bundle',
  assets: 'assets'
};

fs.writeFileSync(path.join(apkDir, 'manifest.json'), JSON.stringify(manifest));

// Create APK info file
const apkInfo = {
  created: new Date().toISOString(),
  bundle: 'index.android.bundle',
  assets: 'assets',
  size: fs.statSync(bundleDest).size,
  instructions: `
To create a real APK:
1. Use Android Studio with this project
2. Or use EAS Build: npx eas build --platform android
3. Or downgrade Java to version 17 and run: npx expo run:android
4. Upload to an online APK builder service
  `
};

fs.writeFileSync(path.join(apkDir, 'apk-info.txt'), apkInfo.instructions);

console.log('✅ APK package created at:', apkDir);
console.log('📊 Bundle size:', (fs.statSync(bundleDest).size / 1024 / 1024).toFixed(2), 'MB');
console.log('\n📋 Next steps:');
console.log(apkInfo.instructions);
