@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      http://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @set DEBUG=0
@if "%DEBUG%" == "0" @set DEBUG=0

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

@rem Uncomment this line to override the Gradle executable. This should be used with caution.
@rem set GRADLE_WRAPPER=%~dp0\gradlew.bat

@rem Determine the Command Processor to use
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" set ARCH=amd64
if "%PROCESSOR_ARCHITECTURE%"=="IA64" set ARCH=amd64
if "%PROCESSOR_ARCHITECTURE%"=="x86" set ARCH=x86
if "%PROCESSOR_ARCHITECTURE%"=="x86_64" set ARCH=x86_64
if not defined ARCH set ARCH=x86

@rem Find gradle.exe
set GRADLE_EXE=%~dp0\gradle\bin\gradle.exe
if exist "%GRADLE_EXE%" goto :foundGradle

echo ERROR: GRADLE installation not found. Please set GRADLE_HOME or add gradle to your PATH.
goto :eof

:foundGradle
set APP_HOME=%~dp0

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
if exist "%JAVA_HOME%\bin\java.exe" set JAVA_EXE=%JAVA_HOME%\bin\java.exe
if exist "%JAVA_HOME%\jre\bin\java.exe" set JAVA_EXE=%JAVA_HOME%\jre\bin\java.exe

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%APP_HOME%\gradle\wrapper\gradle-wrapper.jar" org.gradle.wrapper.GradleWrapperMain %APP_ARGS%

:eof
@endlocal
