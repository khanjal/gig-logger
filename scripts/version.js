// For AWS Amplify use CODEBUILD_BUILD_NUMBER. For GitHub Actions, use GITHUB_RUN_NUMBER.
// const build = process.env.GITHUB_RUN_NUMBER || Date.now();
const build = process.env.CODEBUILD_BUILD_NUMBER || Date.now();
const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const version = date;
const fs = require('fs');
fs.writeFileSync('./src/assets/version.json', JSON.stringify({ version, build }));
