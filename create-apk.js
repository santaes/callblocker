const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Creating APK...');

try {
  // Try to build APK using a simpler approach
  console.log('📦 Building release APK...');
  
  // Use gradlew with specific flags to bypass some Java version issues
  const buildCommand = 'cd android && gradlew.bat assembleRelease --no-daemon --stacktrace';
  console.log('Running:', buildCommand);
  
  const result = execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  });
  
  console.log('✅ APK build completed!');
  
  // Check if APK was created
  const apkPath = path.join(__dirname, 'android/app/build/outputs/apk/release/app-release.apk');
  if (fs.existsSync(apkPath)) {
    console.log('📱 APK created at:', apkPath);
    const stats = fs.statSync(apkPath);
    console.log(`📊 APK Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('❌ APK not found. Checking alternative locations...');
    
    // Check for different APK locations
    const possiblePaths = [
      'android/app/build/outputs/apk/release/app-release.apk',
      'android/build/outputs/apk/release/app-release.apk',
      'android/app/build/outputs/apk/release/app-release-unsigned.apk'
    ];
    
    for (const checkPath of possiblePaths) {
      const fullPath = path.join(__dirname, checkPath);
      if (fs.existsSync(fullPath)) {
        console.log('✅ APK found at:', fullPath);
        break;
      }
    }
  }
  
} catch (error) {
  console.error('❌ APK build failed:', error.message);
  console.log('\n💡 Alternative solutions:');
  console.log('1. Use EAS Build: npx eas build --platform android');
  console.log('2. Downgrade Java to version 17');
  console.log('3. Use Android Studio');
}
