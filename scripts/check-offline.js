const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'miniprogram');
const failures = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.js')) {
      const source = fs.readFileSync(file, 'utf8');
      if (file.endsWith(path.join('utils', 'cloud.js'))) continue;
      if (/wx\.cloud|cloud\.call\s*\(/.test(source)) failures.push(`${path.relative(root, file)} still calls cloud services`);
      try { new Function(source); } catch (error) { failures.push(`${path.relative(root, file)} syntax: ${error.message}`); }
    }
  }
}
walk(root);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Offline validation passed: no cloud calls and all frontend JS parses.');