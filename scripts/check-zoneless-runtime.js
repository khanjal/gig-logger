const fs = require('fs');
const path = require('path');

const root = process.cwd();

const targets = [
  path.join(root, 'src', 'main.ts'),
  path.join(root, 'src', 'polyfills.ts'),
  path.join(root, 'src', 'app')
];

const excludedFiles = new Set([
  path.join(root, 'src', 'test.ts')
]);

const tsFile = /\.ts$/i;
const forbiddenImport = /^\s*import\s+['\"]zone\.js(?:\/testing)?['\"];?/m;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (tsFile.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function getFiles() {
  const files = [];
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      files.push(...walk(target));
    } else {
      files.push(target);
    }
  }
  return files.filter(file => !excludedFiles.has(file));
}

const violations = [];
for (const file of getFiles()) {
  const text = fs.readFileSync(file, 'utf8');
  if (forbiddenImport.test(text)) {
    violations.push(path.relative(root, file));
  }
}

if (violations.length > 0) {
  console.error('Zoneless runtime guard failed. Remove zone imports from runtime files:');
  for (const file of violations) {
    console.error(` - ${file}`);
  }
  process.exit(1);
}

console.log('Zoneless runtime guard passed.');
