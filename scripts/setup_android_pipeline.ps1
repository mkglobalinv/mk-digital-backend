# Mksubdata Android Pipeline Auto-Setup Script
# This script detects, installs, and configures the Android build environment.

$ErrorActionPreference = "SilentlyContinue"

Write-Host "--- [1/4] Detecting Environment ---" -ForegroundColor Cyan

function Check-Tool ($name, $cmd) {
    $path = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($path) {
        Write-Host "✅ $name found at: $($path.Source)" -ForegroundColor Green
        return $path.Source
    } else {
        Write-Host "❌ $name not found" -ForegroundColor Yellow
        return $null
    }
}

$javaPath = Check-Tool "JDK (Java)" "java"
$gradlePath = Check-Tool "Gradle" "gradle"
$adbPath = Check-Tool "Android SDK (adb)" "adb"

Write-Host "`n--- [2/4] Installing Missing Tools ---" -ForegroundColor Cyan

if (-not $javaPath) {
    Write-Host "Installing JDK 17..." -ForegroundColor Gray
    winget install Microsoft.OpenJDK.17 --accept-source-agreements --accept-package-agreements
}

if (-not $adbPath) {
    Write-Host "Installing Android Studio (Includes SDK)..." -ForegroundColor Gray
    Write-Host "⚠️ IMPORTANT: A setup window will appear. Click 'Next' through everything and finish. I will continue after." -ForegroundColor Yellow
    winget install Google.AndroidStudio --accept-source-agreements --accept-package-agreements
}

if (-not $gradlePath) {
    Write-Host "Installing Gradle..." -ForegroundColor Gray
    winget install Gradle.Gradle --accept-source-agreements --accept-package-agreements
}

Write-Host "`n--- [3/4] Configuring Paths ---" -ForegroundColor Cyan

# Attempt to locate Android SDK automatically
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "Found Android SDK at: $sdkPath" -ForegroundColor Green
    
    # Set ANDROID_HOME globally
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
    $env:ANDROID_HOME = $sdkPath
    
    # Add platform-tools to Path
    $pathToAdd = "$sdkPath\platform-tools"
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$pathToAdd*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$pathToAdd", "User")
        Write-Host "Added $pathToAdd to User PATH" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Android SDK not yet initialized. Please open Android Studio once to complete SDK setup." -ForegroundColor Yellow
}

Write-Host "`n--- [4/4] Validating Build Pipeline ---" -ForegroundColor Cyan

# Refresh environment variables for current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "Testing APK Generation logic..." -ForegroundColor Gray
node -e "
const { checkBuildTools } = require('./services/appAssetService.js');
checkBuildTools().then(res => {
    console.log('Build Tools Status:', res);
    if (res.jdk && res.gradle) {
        console.log('✅ Pipeline is READY to build APKs!');
    } else {
        console.log('❌ Pipeline still needs configuration.');
        console.log('Recommendation: Restart your computer to apply PATH changes, then open Android Studio to install SDK components.');
    }
}).catch(err => console.error(err));
"

Write-Host "`nSetup process complete. Please restart your terminal/computer to ensure all tools are recognized." -ForegroundColor Green
