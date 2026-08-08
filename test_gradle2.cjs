const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const crypto = require('crypto');
function hashFile(f) {
  if(!fs.existsSync(f)) return 'NOT FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
}
const buildDir = path.join(process.cwd(), 'builds', 'customerdapp');
if(fs.existsSync(buildDir)) fs.rmSync(buildDir, {recursive:true, force:true});
fs.mkdirSync(buildDir, {recursive:true});
const templateDir = path.join(process.cwd(), 'templates', 'android-base');
function copyR(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if(!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(c => copyR(path.join(src, c), path.join(dest, c)));
  } else fs.copyFileSync(src, dest);
}
copyR(templateDir, buildDir);
console.log('After copy:', hashFile(path.join(buildDir, 'app/build/outputs/apk/release/app-release.apk')));

// Replace applicationId
const gradlePath = path.join(buildDir, 'app', 'build.gradle');
let gradleContent = fs.readFileSync(gradlePath, 'utf8');
gradleContent = gradleContent.replace('applicationId "com.mksubdata.app"', `applicationId "com.customer.d"`);
fs.writeFileSync(gradlePath, gradleContent);

// Replace logo with dummy valid png (1x1 pixel)
const iconResPath = path.join(buildDir, 'app', 'src', 'main', 'res', 'drawable', 'ic_launcher.png');
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
fs.writeFileSync(iconResPath, dummyPng);

console.log('Executing Gradle...');
const buildCmd = 'C:\\gradle-8.5\\bin\\gradle.bat assembleRelease --console=plain --no-daemon';
cp.execSync(buildCmd, {cwd: buildDir, env: {...process.env, JAVA_OPTS: '-Xmx1024m'}});
console.log('After gradle:', hashFile(path.join(buildDir, 'app/build/outputs/apk/release/app-release.apk')));
