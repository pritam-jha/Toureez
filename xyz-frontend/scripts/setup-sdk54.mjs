import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'assets');
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

fs.mkdirSync(assetsDir, { recursive: true });
for (const file of ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png']) {
  fs.writeFileSync(path.join(assetsDir, file), png);
}

const nodeModules = path.join(root, 'node_modules');
if (fs.existsSync(nodeModules)) {
  fs.rmSync(nodeModules, { recursive: true, force: true });
}

const lockfile = path.join(root, 'package-lock.json');
if (fs.existsSync(lockfile)) {
  fs.unlinkSync(lockfile);
}

console.log('Installing dependencies...');
execSync('npm install', { cwd: root, stdio: 'inherit' });
console.log('Aligning Expo SDK packages...');
execSync('npx expo install --fix', { cwd: root, stdio: 'inherit' });
console.log('Running expo-doctor...');
try {
  execSync('npx expo-doctor@latest', { cwd: root, stdio: 'inherit' });
} catch {
  // expo-doctor exits non-zero when issues remain
}
console.log('Installed versions:');
execSync('npm ls expo react react-native expo-router --depth=0', {
  cwd: root,
  stdio: 'inherit',
});
