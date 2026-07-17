# Mksubdata Android Environment Setup
# This script configures the PATH and environment variables for the Android pipeline.

$studioPath = "C:\Program Files\Android\Android Studio"
$jdkPath = "$studioPath\jbr"
# Common SDK locations
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\sdk",
    "C:\Android"
)

Write-Host "--- Configuring Environment ---" -ForegroundColor Cyan

# 1. Set JAVA_HOME Permanently
if (Test-Path "$jdkPath\bin\java.exe") {
    [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
    $env:JAVA_HOME = $jdkPath
    Write-Host "✅ JAVA_HOME set to: $jdkPath" -ForegroundColor Green
    
    # Add Java bin to PATH
    $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $binPath = "$jdkPath\bin"
    if ($currentPath -notlike "*$binPath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$binPath", "User")
        Write-Host "✅ Added Java to User PATH" -ForegroundColor Green
    }
}

# 2. Detect Android SDK
$foundSdk = $null
foreach ($path in $sdkPaths) {
    if (Test-Path "$path\platform-tools") {
        $foundSdk = $path
        break
    }
}

if ($foundSdk) {
    [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", $foundSdk, "User")
    $env:ANDROID_HOME = $foundSdk
    Write-Host "✅ ANDROID_HOME set to: $foundSdk" -ForegroundColor Green
    
    # Add platform-tools to Path
    $ptPath = "$foundSdk\platform-tools"
    if ($currentPath -notlike "*$ptPath*") {
        [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$ptPath", "User")
        Write-Host "✅ Added platform-tools to User PATH" -ForegroundColor Green
    }
    
    Write-Host "🚀 Pipeline is now READY to build APKs!" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Android SDK not fully installed yet." -ForegroundColor Yellow
    Write-Host "ACTION REQUIRED: Please open Android Studio once and complete the 'Setup Wizard' to download the SDK components." -ForegroundColor White
}

Write-Host "`nEnvironment updated. Please restart any open terminal windows." -ForegroundColor Cyan
