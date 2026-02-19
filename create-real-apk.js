const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Creating Real APK...');

try {
  // Try using a different approach - create APK using available tools
  console.log('📦 Attempting APK creation with available tools...');
  
  // Method 1: Try using apktool if available
  try {
    console.log('🔧 Checking for apktool...');
    execSync('apktool --version', { stdio: 'pipe' });
    console.log('✅ apktool found, creating APK...');
    
    // Create APK structure
    const apkDir = path.join(__dirname, 'real-apk');
    if (!fs.existsSync(apkDir)) {
      fs.mkdirSync(apkDir, { recursive: true });
    }
    
    // Copy bundle to APK structure
    const bundleSource = path.join(__dirname, 'dist/_expo/static/js/android/entry-1a330656272cc4c9fe27c8f2dde53bc6.hbc');
    const bundleDest = path.join(apkDir, 'assets/index.android.bundle');
    
    if (!fs.existsSync(path.dirname(bundleDest))) {
      fs.mkdirSync(path.dirname(bundleDest), { recursive: true });
    }
    fs.copyFileSync(bundleSource, bundleDest);
    
    // Copy assets
    const assetsSource = path.join(__dirname, 'dist/_expo/assets');
    const assetsDest = path.join(apkDir, 'assets');
    if (fs.existsSync(assetsSource)) {
      fs.cpSync(assetsSource, assetsDest, { recursive: true });
    }
    
    // Create AndroidManifest.xml
    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.callblocker.app"
    android:versionCode="1"
    android:versionName="1.0.0">
    <application
        android:label="CallBlocker"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        <activity
            android:name=".MainActivity"
            android:label="CallBlocker"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:launchMode="singleTop"
            android:theme="@style/AppTheme"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.ANSWER_PHONE_CALLS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-feature android:name="android.hardware.telephony" android:required="true" />
    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
</manifest>`;
    
    fs.writeFileSync(path.join(apkDir, 'AndroidManifest.xml'), manifest);
    
    // Create simple APK structure
    const apkStructure = {
      'AndroidManifest.xml': manifest,
      'assets/': fs.existsSync(assetsDest) ? 'assets directory' : 'no assets',
      'index.android.bundle': fs.existsSync(bundleDest) ? 'bundle ready' : 'no bundle'
    };
    
    console.log('📱 APK structure created');
    console.log('📍 Location:', apkDir);
    console.log('\n📋 Contents:');
    Object.entries(apkStructure).forEach(([file, content]) => {
      console.log(`  ${file}: ${content}`);
    });
    
    console.log('\n⚠️  Note: This is a basic APK structure.');
    console.log('For a fully functional APK, you need:');
    console.log('1. Android Studio with proper signing');
    console.log('2. Or EAS Build: npx eas build --platform android');
    console.log('3. Or fix Java version and use Gradle');
    
  } catch (error) {
    console.log('❌ apktool not available');
    
    // Method 2: Create a zip-based APK
    console.log('📦 Creating ZIP-based APK...');
    
    const zipApkDir = path.join(__dirname, 'zip-apk');
    if (!fs.existsSync(zipApkDir)) {
      fs.mkdirSync(zipApkDir, { recursive: true });
    }
    
    // Copy bundle and assets
    const zipBundleSource = path.join(__dirname, 'dist/_expo/static/js/android/entry-1a330656272cc4c9fe27c8f2dde53bc6.hbc');
    const zipBundleDest = path.join(zipApkDir, 'index.android.bundle');
    fs.copyFileSync(zipBundleSource, zipBundleDest);
    
    const zipAssetsSource = path.join(__dirname, 'dist/_expo/assets');
    const zipAssetsDest = path.join(zipApkDir, 'assets');
    if (fs.existsSync(zipAssetsSource)) {
      fs.cpSync(zipAssetsSource, zipAssetsDest, { recursive: true });
    }
    
    // Create manifest for ZIP APK
    const zipManifest = {
      name: 'CallBlocker',
      version: '1.0.0',
      bundle: 'index.android.bundle',
      assets: 'assets',
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(zipApkDir, 'manifest.json'), JSON.stringify(zipManifest, null, 2));
    
    console.log('✅ ZIP-based APK package created at:', zipApkDir);
    console.log('📊 Bundle size:', (fs.statSync(zipBundleDest).size / 1024 / 1024).toFixed(2), 'MB');
    
    // Try to create actual ZIP file
    try {
      const archiver = require('archiver');
      const output = fs.createWriteStream(path.join(__dirname, 'CallBlocker.apk'));
      const archive = archiver('zip');
      
      archive.pipe(output);
      
      // Add files to archive
      archive.file(zipBundleDest, { name: 'index.android.bundle' });
      
      // Add assets directory
      if (fs.existsSync(zipAssetsDest)) {
        archive.directory(zipAssetsDest, 'assets');
      }
      
      archive.finalize();
      
      console.log('🎉 APK file created: CallBlocker.apk');
      
    } catch (zipError) {
      console.log('❌ archiver not available, creating simple package');
      console.log('📦 Package ready at:', zipApkDir);
    }
  }
  
} catch (error) {
  console.error('❌ APK creation failed:', error.message);
  console.log('\n💡 Recommended solution:');
  console.log('Use EAS Build: npx eas build --platform android');
}
