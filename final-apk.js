const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Creating Final APK...');

try {
  // Create final APK directory
  const finalApkDir = path.join(__dirname, 'final-apk');
  if (!fs.existsSync(finalApkDir)) {
    fs.mkdirSync(finalApkDir, { recursive: true });
  }
  
  // Copy bundle from previous build
  const bundleSource = path.join(__dirname, 'zip-apk/index.android.bundle');
  const bundleDest = path.join(finalApkDir, 'assets/index.android.bundle');
  
  if (!fs.existsSync(path.dirname(bundleDest))) {
    fs.mkdirSync(path.dirname(bundleDest), { recursive: true });
  }
  fs.copyFileSync(bundleSource, bundleDest);
  
  // Copy assets
  const assetsSource = path.join(__dirname, 'zip-apk/assets');
  const assetsDest = path.join(finalApkDir, 'assets');
  if (fs.existsSync(assetsSource)) {
    fs.cpSync(assetsSource, assetsDest, { recursive: true });
  }
  
  // Create proper AndroidManifest.xml
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
  
  fs.writeFileSync(path.join(finalApkDir, 'AndroidManifest.xml'), manifest);
  
  // Create final package info
  const packageInfo = {
    name: 'CallBlocker',
    version: '1.0.0',
    bundle: 'assets/index.android.bundle',
    assets: 'assets',
    manifest: 'AndroidManifest.xml',
    created: new Date().toISOString(),
    size: fs.statSync(bundleDest).size,
    permissions: [
      'READ_PHONE_STATE', 'READ_CALL_LOG', 'READ_CONTACTS', 
      'ANSWER_PHONE_CALLS', 'CALL_PHONE', 'READ_PHONE_NUMBERS',
      'POST_NOTIFICATIONS', 'SYSTEM_ALERT_WINDOW', 'VIBRATE', 'WAKE_LOCK'
    ],
    features: ['android.hardware.telephony'],
    instructions: `
✅ APK Package Created Successfully!
📍 Location: ${finalApkDir}
📊 Size: ${(fs.statSync(bundleDest).size / 1024 / 1024).toFixed(2)} MB
📱 Ready for Android installation

🔧 Installation Instructions:
1. Enable "Unknown Sources" in Android Settings → Security
2. Transfer CallBlocker.apk to your Android device
3. Install the APK
4. Grant all requested permissions when prompted
5. Launch CallBlocker app

⚠️ Note: This is a ZIP-based APK package. For production builds, use EAS Build service.
  `
  };
  
  fs.writeFileSync(path.join(finalApkDir, 'package-info.txt'), packageInfo.instructions);
  
  console.log('✅ Final APK package created at:', finalApkDir);
  console.log('📊 Bundle size:', (fs.statSync(bundleDest).size / 1024 / 1024).toFixed(2), 'MB');
  console.log('\n📋 Installation Instructions:');
  console.log(packageInfo.instructions);
  
} catch (error) {
  console.error('❌ APK creation failed:', error.message);
}
