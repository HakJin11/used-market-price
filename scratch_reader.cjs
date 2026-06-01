const fs = require('fs');
const path = require('path');

const target = process.argv[2];
const startLine = parseInt(process.argv[3]) || 1;
const endLine = parseInt(process.argv[4]) || 1000;

if (!target) {
  console.log("Provide file path");
  process.exit(1);
}

try {
  const filePath = path.resolve(target);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`=== FILE: ${filePath} (lines ${startLine}-${endLine}/${lines.length}) ===`);
  for (let i = startLine - 1; i < Math.min(endLine, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} catch (err) {
  console.error(err);
}
