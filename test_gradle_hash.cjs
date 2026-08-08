const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const crypto = require('crypto');
function hashFile(f) {
  if(!fs.existsSync(f)) return 'NOT FOUND';
  return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
}
const buildDir = path.join(process.cwd(), 'builds', 'customercapp_test');
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
console.log('Executing Gradle...');
const buildCmd = 'C:\\gradle-8.5\\bin\\gradle.bat assembleRelease --console=plain --no-daemon';
cp.execSync(buildCmd, {cwd: buildDir, env: {...process.env, JAVA_OPTS: '-Xmx1024m'}});
console.log('After gradle:', hashFile(path.join(buildDir, 'app/build/outputs/apk/release/app-release.apk')));
