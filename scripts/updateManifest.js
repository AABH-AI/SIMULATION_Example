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
    .filter(f => f.endsWith('.html') && f !== 'index.html' && fs.statSync(path.join(dir, f)).isFile());
}

function getLatestAutoPage(autoPages) {
  const entries = Object.entries(autoPages || {});
  if (!entries.length) return null;
  entries.sort((a, b) => new Date(b[1].updated) - new Date(a[1].updated));
  return entries[0];
}

function main() {
  const manifest = readManifest();
  manifest.autoPages = {};
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

  const latest = getLatestAutoPage(manifest.autoPages);
  if (latest) {
    manifest.latestAutoPage = {
      file: latest[0],
      updated: latest[1].updated
    };
  } else {
    delete manifest.latestAutoPage;
  }

  const publishAt = process.env.PAGES_PUBLISHED_AT || process.env.PUBLISHED_AT;
  if (publishAt) {
    manifest.pagesPublishedAt = publishAt;
  }

  writeManifest(manifest);
  console.log('manifest.json updated with', htmlFiles.length, 'HTML files.');
  if (publishAt) console.log('Published timestamp set to', publishAt);
}

if (require.main === module) main();
