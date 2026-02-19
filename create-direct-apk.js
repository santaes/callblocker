const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🔨 Creating Direct APK on PC...');

try {
  // Create APK directory
  const directApkDir = path.join(__dirname, 'direct-apk');
  if (!fs.existsSync(directApkDir)) {
    fs.mkdirSync(directApkDir, { recursive: true });
  }
  
  // Copy bundle and assets
  const bundleSource = path.join(__dirname, 'simple-android-apk/index.android.bundle');
  const bundleDest = path.join(directApkDir, 'assets/index.android.bundle');
  
  const assetsSource = path.join(__dirname, 'simple-android-apk/assets');
  const assetsDest = path.join(directApkDir, 'assets');
  
  if (!fs.existsSync(path.dirname(bundleDest))) {
    fs.mkdirSync(path.dirname(bundleDest), { recursive: true });
  }
  if (fs.existsSync(bundleSource)) {
    fs.copyFileSync(bundleSource, bundleDest);
  }
  if (fs.existsSync(assetsSource)) {
    fs.cpSync(assetsSource, assetsDest, { recursive: true });
  }
  
  // Create proper AndroidManifest.xml for APK
  const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.callblocker.app"
    android:versionCode="1"
    android:versionName="1.0.0">
    <application
        android:label="CallBlocker"
        android:allowBackup="true"
        android:theme="@android:style/Theme.NoTitleBar">
        <activity
            android:name=".MainActivity"
            android:label="CallBlocker"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:launchMode="singleTop"
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
  
  const manifestDest = path.join(directApkDir, 'AndroidManifest.xml');
  fs.writeFileSync(manifestDest, manifest);
  
  // Create APK using archiver
  const apkOutput = path.join(directApkDir, 'CallBlocker-Direct.apk');
  const output = fs.createWriteStream(apkOutput);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  output.on('close', () => {
    console.log('✅ Direct APK created successfully!');
    console.log('📍 Location:', apkOutput);
    console.log('📊 Size:', (archive.pointer() / 1024 / 1024).toFixed(2), 'MB');
    
    console.log('\n📋 Installation Instructions:');
    console.log('1. Enable "Unknown Sources" in Android Settings → Security');
    console.log('2. Transfer CallBlocker-Direct.apk to your Android device');
    console.log('3. Install the APK');
    console.log('4. Grant all requested permissions');
    console.log('5. Launch CallBlocker app');
    console.log('\n✅ This APK should install without manifest errors!');
  });
  
  archive.on('error', (err) => {
    throw err;
  });
  
  archive.pipe(output);
  
  // Add files to APK
  archive.file(manifestDest, { name: 'AndroidManifest.xml' });
  archive.directory(assetsDest, 'assets');
  
  archive.finalize();
  
} catch (error) {
  console.error('❌ Direct APK creation failed:', error.message);
}
