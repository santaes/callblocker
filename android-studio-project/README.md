# CallBlocker Android Studio Project

## 📱 Project Structure
This is a complete Android Studio project for your CallBlocker React Native app.

## 🚀 How to Build APK

### Method 1: Android Studio GUI
1. Open Android Studio
2. Click "Open an existing project"
3. Navigate to: `C:\Users\oleks\Desktop\CallBlocker\android-studio-project`
4. Wait for Gradle sync
5. Click Build → Build Bundle(s) / APK(s) → Build APK(s)
6. APK will be created in: `android-studio-project/app/build/outputs/apk/release/`

### Method 2: Command Line
1. Open Command Prompt in this directory
2. Run: `gradlew assembleRelease`
3. APK will be created in: `app/build/outputs/apk/release/`

## 📁 Project Files
- `build.gradle` - Main build configuration
- `settings.gradle` - Gradle settings
- `gradle.properties` - Gradle properties
- `src/main/AndroidManifest.xml` - App manifest with permissions
- `src/main/java/` - Java source files
- `src/main/assets/` - React Native bundle and assets

## 🔧 What's Included
- ✅ All CallBlocker permissions for phone access
- ✅ React Native integration
- ✅ Proper Android manifest
- ✅ Gear icon in settings (from your app)
- ✅ Call blocking functionality

## 📋 Build Requirements
- Android Studio installed
- Java 8 or higher
- Android SDK 33 or higher

## 🎯 Next Steps
1. Open this project in Android Studio
2. Build the APK
3. Install and test on your device
4. Your CallBlocker app will be ready!

## 📞 Troubleshooting
If build fails:
1. Check Android SDK installation
2. Update Gradle wrapper
3. Verify Java version
4. Check internet connection for dependencies

The React Native bundle is already included in `src/main/assets/index.android.bundle` (3.71 MB).
