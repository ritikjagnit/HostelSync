@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set "DIR=%~dp0"
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"

@REM Check for Java
if not defined JAVA_HOME (
  for %%I in (java.exe) do set "JAVACMD=%%~$PATH:I"
) else (
  set "JAVACMD=%JAVA_HOME%\bin\java.exe"
)

if not exist "%JAVACMD%" (
  echo Error: JAVA_HOME is not set and no 'java' command could be found in your PATH.
  echo Please install JDK 21 and ensure 'java' is accessible in your PATH.
  exit /b 1
)

@REM Determine wrapper jar
set "WRAPPER_JAR=%DIR%\.mvn\wrapper\maven-wrapper.jar"

@REM Download wrapper jar if not present
if not exist "%WRAPPER_JAR%" (
  echo Downloading Maven Wrapper...
  powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $webClient = New-Object System.Net.WebClient; $webClient.DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar', '%WRAPPER_JAR%')"
)

"%JAVACMD%" -Dmaven.multiModuleProjectDirectory="%DIR%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
exit /b %ERRORLEVEL%
