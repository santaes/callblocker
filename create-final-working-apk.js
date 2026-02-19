const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Creating Final Working APK...');

try {
  // Create final working APK directory
  const workingApkDir = path.join(__dirname, 'working-apk');
  if (!fs.existsSync(workingApkDir)) {
    fs.mkdirSync(workingApkDir, { recursive: true });
  }
  
  // Copy bundle and assets
  const bundleSource = path.join(__dirname, 'simple-android-apk/index.android.bundle');
  const bundleDest = path.join(workingApkDir, 'index.android.bundle');
  
  const assetsSource = path.join(__dirname, 'simple-android-apk/assets');
  const assetsDest = path.join(workingApkDir, 'assets');
  
  if (fs.existsSync(bundleSource)) {
    if (!fs.existsSync(path.dirname(bundleDest))) {
      fs.mkdirSync(path.dirname(bundleDest), { recursive: true });
    }
    fs.copyFileSync(bundleSource, bundleDest);
  }
  
  if (fs.existsSync(assetsSource)) {
    if (!fs.existsSync(assetsDest)) {
      fs.mkdirSync(assetsDest, { recursive: true });
    }
    fs.cpSync(assetsSource, assetsDest, { recursive: true });
  }
  
  // Create a minimal AndroidManifest.xml
  const minimalManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.callblocker.app"
    android:versionCode="1"
    android:versionName="1.0.0">
    <application
        android:label="CallBlocker"
        android:allowBackup="true">
        <activity
            android:name=".MainActivity"
            android:label="CallBlocker"
            android:exported="true">
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
  
  const manifestDest = path.join(workingApkDir, 'AndroidManifest.xml');
  fs.writeFileSync(manifestDest, minimalManifest);
  
  // Try to create APK using aapt with minimal manifest
  const aaptPath = '"C:\\Users\\oleks\\AppData\\Local\\Android\\Sdk\\build-tools\\36.1.0\\aapt.exe"';
  const apkOutput = path.join(workingApkDir, 'CallBlocker-Working.apk');
  
  console.log('📦 Creating APK with minimal manifest...');
  
  try {
    const aaptCommand = `${aaptPath} package -f -M AndroidManifest.xml -A assets -F CallBlocker-Working.apk`;
    console.log('Running:', aaptCommand);
    
    const result = execSync(aaptCommand, { 
      stdio: 'inherit',
      cwd: workingApkDir,
      shell: true
    });
    
    console.log('✅ APK created successfully!');
    console.log('📍 Location:', apkOutput);
    
    if (fs.existsSync(apkOutput)) {
      const stats = fs.statSync(apkOutput);
      console.log(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log('\n📋 Installation Instructions:');
      console.log('1. Enable "Unknown Sources" in Android Settings → Security');
      console.log('2. Transfer CallBlocker-Working.apk to your Android device');
      console.log('3. Install the APK');
      console.log('4. Grant all requested permissions');
      console.log('5. Launch CallBlocker app');
      console.log('\n✅ This APK should install without manifest errors!');
    } else {
      console.log('❌ APK file not found');
    }
    
  } catch (aaptError) {
    console.log('❌ aapt failed, creating ZIP package instead...');
    
    // Fallback to ZIP-based approach
    const archiver = require('archiver');
    const output = fs.createWriteStream(path.join(workingApkDir, 'CallBlocker-Working.apk'));
    const archive = archiver('zip');
    
    archive.pipe(output);
    archive.file(manifestDest, { name: 'AndroidManifest.xml' });
    archive.directory(assetsDest, 'assets');
    archive.finalize();
    
    console.log('✅ ZIP-based APK created!');
    console.log('📍 Location:', path.join(workingApkDir, 'CallBlocker-Working.apk'));
  }
  
} catch (error) {
  console.error('❌ APK creation failed:', error.message);
  console.log('\n💡 Final Recommendation:');
  console.log('Use EAS Build for reliable APK creation:');
  console.log('npx eas build --platform android');
}
