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

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=%~dp0
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." or ".." in APP_HOME to make it absolute.
if "%APP_HOME:~-1,%"=="%" set APP_HOME=%~dp0
if "%APP_HOME:~-2,%"==".." set APP_HOME=%~dp0
if "%APP_HOME:~-3,%"==".." set APP_HOME=%~dp0
if "%APP_HOME:~-4,%"==".." set APP_HOME=%~dp0

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
if not defined JAVA_HOME (
  echo ERROR: Environment variable JAVA_HOME has not been set.
  echo ERROR: Please set the JAVA_HOME variable in your environment to match the
  echo ERROR: location of your Java installation.
  echo ERROR: For example:
  echo ERROR:   set JAVA_HOME=C:\Program Files\Java\jdk1.8.0_92
  echo ERROR:   set PATH=%%JAVA_HOME%%\bin;%%PATH%%
  echo ERROR:   gradlew.bat assembleRelease
  goto end
)

:findJavaFromJavaHome
set JAVA_EXEC=%JAVA_HOME:/bin/java.exe
if exist "%JAVA_EXEC%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo ERROR: Please set the JAVA_HOME variable in your environment to match the
echo ERROR: location of your Java installation.
echo ERROR: For example:
echo ERROR:   set JAVA_HOME=C:\Program Files\Java\jdk1.8.0_92
echo ERROR:   set PATH=%%JAVA_HOME%%\bin;%%PATH%%
echo ERROR:   gradlew.bat assembleRelease

goto end

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar


@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %APP_ARGS%

:end
@endlocal
