#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const manifestPath = path.join(root, 'manifest.json');

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function gatherHtmlFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html') && fs.statSync(path.join(dir, f)).isFile());
}

function main() {
  const manifest = readManifest();
  manifest.autoPages = manifest.autoPages || {};
  const htmlFiles = gatherHtmlFiles(root);

  htmlFiles.forEach(file => {
    const p = path.join(root, file);
    const content = fs.readFileSync(p, 'utf8');
    const stat = fs.statSync(p);
    manifest.autoPages[file] = {
      path: file,
      updated: stat.mtime.toISOString(),
      content: content
    };
  });

  writeManifest(manifest);
  console.log('manifest.json updated with', htmlFiles.length, 'HTML files.');
}

if (require.main === module) main();
