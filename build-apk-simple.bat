@echo off
echo Building CallBlocker APK...
cd /d "C:\Users\oleks\Desktop\CallBlocker\android-studio-project"

echo.
echo Checking for Gradle...
if exist "gradle\bin\gradle.exe" (
    echo Found Gradle, building APK...
    gradle\bin\gradle.exe assembleRelease
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ APK build completed successfully!
        echo 📍 APK location: app\build\outputs\apk\release\app-release.apk
        echo 📱 Ready for installation!
    ) else (
        echo.
        echo ❌ APK build failed
    )
) else (
    echo.
    echo ❌ Gradle not found in gradle\bin\
    echo 💡 Please install Gradle or use Android Studio
)

echo.
pause
