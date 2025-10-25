// For AWS Amplify use CODEBUILD_BUILD_NUMBER. For GitHub Actions, use GITHUB_RUN_NUMBER.
// const build = process.env.GITHUB_RUN_NUMBER || Date.now();
const build = process.env.CODEBUILD_BUILD_NUMBER || Date.now();
const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const version = date;
const fs = require('fs');

// Write version.json for the app
fs.writeFileSync('./src/assets/version.json', JSON.stringify({ version, build }));

// Update manifest.json with the version
const manifestPath = './src/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
// Format as YYYY.MM.DD.build for the manifest
const formattedVersion = `${date.replace(/-/g, '.')}.${build}`;
manifest.version = formattedVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
