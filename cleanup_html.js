const fs = require('fs');
const path = require('path');

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanDir(fullPath);
    } else if (entry.isFile()) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.startsWith('<!doctype html>') || content.startsWith('﻿<!doctype html>')) {
        fs.unlinkSync(fullPath);
        console.log('Removed HTML fallback file:', fullPath);
      }
    }
  }
}

cleanDir('carecircle-app/src');
