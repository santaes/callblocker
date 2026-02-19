const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building Proper APK with Android Tools...');

const aaptPath = '"C:\\Users\\oleks\\AppData\\Local\\Android\\Sdk\\build-tools\\36.1.0\\aapt.exe"';
const buildDir = path.join(__dirname, 'android-build');
const apkOutput = path.join(buildDir, 'CallBlocker-Proper.apk');

try {
  // Create build directory
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copy resources
  const finalApkDir = path.join(__dirname, 'final-apk');
  const manifestSource = path.join(finalApkDir, 'AndroidManifest.xml');
  const assetsSource = path.join(finalApkDir, 'assets');
  const bundleSource = path.join(finalApkDir, 'assets', 'index.android.bundle');
  
  const manifestDest = path.join(buildDir, 'AndroidManifest.xml');
  const assetsDest = path.join(buildDir, 'assets');
  const bundleDest = path.join(buildDir, 'assets', 'index.android.bundle');
  
  // Ensure directories exist
  if (!fs.existsSync(path.dirname(manifestDest))) {
    fs.mkdirSync(path.dirname(manifestDest), { recursive: true });
  }
  if (!fs.existsSync(assetsDest)) {
    fs.mkdirSync(assetsDest, { recursive: true });
  }
  
  // Copy files
  if (fs.existsSync(manifestSource)) {
    fs.copyFileSync(manifestSource, manifestDest);
  }
  if (fs.existsSync(assetsSource)) {
    fs.cpSync(assetsSource, assetsDest, { recursive: true });
  }
  if (fs.existsSync(bundleSource)) {
    fs.copyFileSync(bundleSource, bundleDest);
  }
  
  console.log('📦 Creating unsigned APK with aapt...');
  
  // Use aapt to create APK
  const aaptCommand = `${aaptPath} package -f -M AndroidManifest.xml -A assets -F CallBlocker-Proper.apk`;
  console.log('Running:', aaptCommand);
  
  const result = execSync(aaptCommand, { 
    stdio: 'inherit',
    cwd: buildDir,
    shell: true
  });
  
  console.log('✅ APK created successfully!');
  console.log('📍 Location:', apkOutput);
  
  // Check if APK was created
  if (fs.existsSync(apkOutput)) {
    const stats = fs.statSync(apkOutput);
    console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n📋 Installation Instructions:');
    console.log('1. Enable "Unknown Sources" in Android Settings → Security');
    console.log('2. Transfer CallBlocker-Proper.apk to your Android device');
    console.log('3. Install the APK');
    console.log('4. Grant all requested permissions when prompted');
    console.log('5. Launch CallBlocker app');
    console.log('\n✅ This APK should install without manifest parsing errors!');
  } else {
    console.log('❌ APK creation failed');
  }
  
} catch (error) {
  console.error('❌ APK build failed:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Ensure Android SDK is properly installed');
  console.log('2. Check aapt.exe path is correct');
  console.log('3. Verify all required files are present');
}
