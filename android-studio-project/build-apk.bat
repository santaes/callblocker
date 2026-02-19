@echo off
echo Building CallBlocker APK...

cd /d "%~dp0"

echo Using Gradle to build APK...
call gradle assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ APK build completed successfully!
    echo 📍 APK location: app\build\outputs\apk\release\app-release.apk
    echo 📱 Ready for installation on Android device
) else (
    echo.
    echo ❌ APK build failed
    echo 💡 Try using Android Studio instead:
    echo    1. Open Android Studio
    echo    2. Open this project folder
    echo    3. Build → Build Bundle(s) / APK(s) → Build APK(s)
)

pause
