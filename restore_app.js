const fs = require('fs');
const content = fs.readFileSync('remote_App.tsx', 'utf8');
const match = content.match(/# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
if (match) {
  const jsonStr = Buffer.from(match[1], 'base64').toString('utf8');
  const json = JSON.parse(jsonStr);
  if (json.sourcesContent && json.sourcesContent[0]) {
    fs.writeFileSync('carecircle-app/src/App.tsx', json.sourcesContent[0], 'utf8');
    console.log('App.tsx restored successfully!');
  }
}
