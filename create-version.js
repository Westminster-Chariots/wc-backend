const fs = require('fs');
const { execSync } = require('child_process');

// Get current git commit
const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

console.log('Creating version info...');
console.log(`Commit: ${gitCommit}`);
console.log(`Branch: ${gitBranch}`);

const versionInfo = {
  commit: gitCommit,
  branch: gitBranch,
  timestamp: new Date().toISOString(),
  documentsRouteExists: fs.existsSync('./src/routes/documents.ts')
};

fs.writeFileSync('./version.json', JSON.stringify(versionInfo, null, 2));
console.log('✓ version.json created');
