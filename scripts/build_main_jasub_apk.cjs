const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PROJECT_ROOT, 'templates', 'android-base');
const BUILD_DIR = path.join(PROJECT_ROOT, '.temp_build', 'main_app_apk_build');
const KEYSTORE_PATH = path.join(PROJECT_ROOT, 'main_jasub_production.jks');
const KEYSTORE_GRADLE_PATH = KEYSTORE_PATH.replace(/\\/g, '/');
const ANDROID_SDK = process.env.ANDROID_HOME || 'C:/Users/userpc/AppData/Local/Android/Sdk';

async function buildMainAppAPK() {
    console.log("=== Building 9JASUB Release APK ===");

    if (!fs.existsSync(KEYSTORE_PATH)) {
        console.error("ERROR: Keystore not found: " + KEYSTORE_PATH);
        process.exit(1);
    }
    console.log("[OK] Keystore: " + KEYSTORE_PATH);

    // Prepare build dir
    if (fs.existsSync(BUILD_DIR)) fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    fs.mkdirSync(BUILD_DIR, { recursive: true });
    fs.cpSync(TEMPLATE_DIR, BUILD_DIR, { recursive: true });
    console.log("[OK] Template cloned.");

    // local.properties
    fs.writeFileSync(path.join(BUILD_DIR, 'local.properties'), `sdk.dir=${ANDROID_SDK.replace(/\\/g, '\\\\')}\n`);

    // strings.xml → 9JASUB
    const stringsPath = path.join(BUILD_DIR, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
    fs.writeFileSync(stringsPath,
        fs.readFileSync(stringsPath, 'utf8').replace(/<string name="app_name">.*?<\/string>/, '<string name="app_name">9JASUB</string>')
    );

    // build.gradle patches
    const gradlePath = path.join(BUILD_DIR, 'app', 'build.gradle');
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(/applicationId\s+"com\.mksubdata\.app"/, 'applicationId "com.jasub.app"');
    gradle = gradle.replace(/storeFile\s+file\(['"]KEYSTORE_PATH_PLACEHOLDER['"]\)/, `storeFile file('${KEYSTORE_GRADLE_PATH}')`);
    gradle = gradle.replace(/storePassword\s+'mksubdata2024'/, `storePassword 'jasub_prod_2026'`);
    gradle = gradle.replace(/keyAlias\s+'reseller_alias'/, `keyAlias 'jasub_main'`);
    gradle = gradle.replace(/keyPassword\s+'mksubdata2024'/, `keyPassword 'jasub_prod_2026'`);
    fs.writeFileSync(gradlePath, gradle);

    // Generate ic_launcher.png
    try {
        const { Jimp } = require('jimp');
        const icon = new Jimp({ width: 512, height: 512, color: 0x3b82f6FF });
        await icon.write(path.join(BUILD_DIR, 'app', 'src', 'main', 'res', 'drawable', 'ic_launcher.png'));
        console.log("[OK] ic_launcher.png generated.");
    } catch (e) {
        console.warn("[WARN] Jimp icon generation failed: " + e.message);
    }

    // Run gradle assembleRelease
    console.log("\nRunning gradle assembleRelease...");
    try {
        execSync(`gradle assembleRelease`, {
            cwd: BUILD_DIR,
            stdio: 'inherit',
            env: { ...process.env, ANDROID_HOME: ANDROID_SDK, ANDROID_SDK_ROOT: ANDROID_SDK }
        });
    } catch (e) {
        console.error("=== APK BUILD FAILED ===");
        process.exit(1);
    }

    // Locate APK output
    const apkCandidates = [
        path.join(BUILD_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
        path.join(BUILD_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    ];
    const outputApk = apkCandidates.find(p => fs.existsSync(p));
    if (!outputApk) {
        console.error("ERROR: APK not found after build.");
        process.exit(1);
    }

    const finalApkPath = path.join(PROJECT_ROOT, '9JASUB-Android.apk');
    fs.copyFileSync(outputApk, finalApkPath);

    const size = (fs.statSync(finalApkPath).size / 1024 / 1024).toFixed(2);
    console.log("\n=== APK BUILD SUCCESS ===");
    console.log("APK: " + finalApkPath);
    console.log("Size: " + size + " MB");

    // Verify APK ZIP header (PK\x03\x04)
    const buf = Buffer.alloc(4);
    const fd = fs.openSync(finalApkPath, 'r');
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    const isZip = buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04;
    console.log("APK magic header valid (ZIP/APK): " + isZip);
    if (!isZip) {
        console.error("ERROR: Output file does not have a valid APK/ZIP header.");
        process.exit(1);
    }

    // Cleanup
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    try { fs.rmdirSync(path.join(PROJECT_ROOT, '.temp_build')); } catch (e) {}
    console.log("[OK] Build temp cleaned up.");
    console.log("\nAPK ready for upload: " + finalApkPath);
}

buildMainAppAPK().catch(err => { console.error(err); process.exit(1); });
