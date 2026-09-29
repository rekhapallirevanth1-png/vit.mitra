const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'db.json');
const dbData = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf8')) : {};
const promptPath = path.join(ROOT, 'MASTER_PROMPT.md');
const promptText = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf8') : '';

const datasetFiles = [
  'vit.xlsx',
  'vit_mitra_members_roster.csv',
  'vit_mitra_2026-09-23.csv',
  'vit_mitra_weekly_report.csv',
  'vit_mitra_monthly_summary.csv',
  'vit_mitra_full_attendance_history.csv',
  'db.json'
];

const embeddedDatasets = datasetFiles.map((filename) => {
  let fPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fPath) && filename === 'vit.xlsx') {
    fPath = path.join(ROOT, 'vit.xlsx');
  }
  const isBinary = filename.endsWith('.xlsx');
  const sizeBytes = fs.existsSync(fPath) ? fs.statSync(fPath).size : 0;
  const content = fs.existsSync(fPath) && !isBinary ? fs.readFileSync(fPath, 'utf8') : '';
  return {
    filename,
    title: filename === 'vit.xlsx' ? 'Master Vishnu Institute of Technology Excel Roster (vit.xlsx)' : filename,
    category: filename.endsWith('.json') ? 'JSON Store' : filename.endsWith('.xlsx') ? 'Excel Roster' : 'CSV Dataset',
    description: filename === 'vit.xlsx' ? 'Official 68-member club roster from vit.xlsx' : `Embedded Vishnu Institute of Technology dataset (${filename})`,
    path: `data/${filename}`,
    sizeBytes,
    rowCount: filename.endsWith('.csv') ? Math.max(0, content.trim().split('\n').length - 1) : 68,
    preview: isBinary ? 'Binary Excel Spreadsheet: 68 club members across AI&DS, AI&ML, CSE, IT, ECE, CSBS, MECH' : content.split('\n').slice(0, 20).join('\n')
  };
});

// Copy all dataset files into dist/data/ and public/data/
const distDataDir = path.join(DIST_DIR, 'data');
const publicDataDir = path.join(PUBLIC_DIR, 'data');
if (!fs.existsSync(distDataDir)) fs.mkdirSync(distDataDir, { recursive: true });
if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

datasetFiles.forEach((f) => {
  let src = path.join(DATA_DIR, f);
  if (!fs.existsSync(src) && f === 'vit.xlsx') {
    src = path.join(ROOT, 'vit.xlsx');
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDataDir, f));
    fs.copyFileSync(src, path.join(publicDataDir, f));
  }
});

// Copy assets to public/
if (fs.existsSync(path.join(ROOT, 'vit.xlsx'))) {
  fs.copyFileSync(path.join(ROOT, 'vit.xlsx'), path.join(PUBLIC_DIR, 'vit.xlsx'));
}
if (fs.existsSync(path.join(ROOT, 'DOCUMENTATION.pdf'))) {
  fs.copyFileSync(path.join(ROOT, 'DOCUMENTATION.pdf'), path.join(PUBLIC_DIR, 'DOCUMENTATION.pdf'));
  fs.copyFileSync(path.join(ROOT, 'DOCUMENTATION.pdf'), path.join(DIST_DIR, 'DOCUMENTATION.pdf'));
}

// Build standalone dist/index.html with inlined CSS, embedded datasets, and app.js
let html = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(PUBLIC_DIR, 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(PUBLIC_DIR, 'app.js'), 'utf8');

const bootstrapPayload = JSON.stringify({
  ...dbData,
  promptText,
  embeddedDatasets
});

html = html.replace('<link rel="stylesheet" href="/styles.css" />', `<style>\n${css}\n</style>`);
html = html.replace(
  '<script src="/app.js"></script>',
  `<script>\nwindow.__VIT_MITRA_EMBEDDED_BOOTSTRAP__ = ${bootstrapPayload};\n${appJs}\n</script>`
);

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(PUBLIC_DIR, 'standalone.html'), html, 'utf8');

console.log('==========================================================');
console.log('  Vishnu Institute of Technology Production Build Complete!');
console.log('  - Standalone Bundle : dist/index.html & public/standalone.html');
console.log('  - Static CDN Assets : public/ (' + fs.readdirSync(PUBLIC_DIR).length + ' assets)');
console.log('  - Bundled Datasets  : dist/data/ & public/data/ (' + datasetFiles.length + ' files)');
console.log('==========================================================');
