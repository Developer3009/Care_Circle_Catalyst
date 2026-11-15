const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
    if (match) {
      try {
        const jsonStr = Buffer.from(match[1], 'base64').toString('utf8');
        const json = JSON.parse(jsonStr);
        if (json.sourcesContent && json.sourcesContent[0]) {
          fs.writeFileSync(fullPath, json.sourcesContent[0], 'utf8');
          console.log('Restored source for:', file);
        }
      } catch (e) {
        console.error('Error on', file, e.message);
      }
    }
  }
}

processDir('remote_source');
