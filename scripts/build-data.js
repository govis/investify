const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const THESES_DIR = path.join(__dirname, '../Theses');
const OUTPUT_DIR = path.join(__dirname, '../frontend/public/api');
const ASSETS_DIR = path.join(__dirname, '../frontend/public/theses-assets');

// Create output directories if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Helper to parse thesis file
const parseThesis = (folderName) => {
  const folderPath = path.join(THESES_DIR, folderName);
  const shortMdPath = path.join(folderPath, 'Short.md');
  
  if (!fs.existsSync(shortMdPath)) return null;

  const content = fs.readFileSync(shortMdPath, 'utf8');
  const lines = content.split('\n');
  
  let title = '';
  let summary = '';
  let readingSummary = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.replace('# ', '').trim();
    } else if (line.includes('Executive Summary')) {
      readingSummary = true;
    } else if (readingSummary) {
      if (line.trim() !== '') {
        summary += line + '\n';
      }
    }
  }

  // Handle image
  const cardImagePath = path.join(folderPath, 'CardImage.jpg');
  let imageUrl = '';
  if (fs.existsSync(cardImagePath)) {
    // Copy image to assets folder
    const targetImagePath = path.join(ASSETS_DIR, `${folderName}.jpg`);
    fs.copyFileSync(cardImagePath, targetImagePath);
    imageUrl = `/theses-assets/${folderName}.jpg`;
  }

  return {
    id: folderName,
    title,
    summary: summary.trim(),
    imageUrl
  };
};

// 1. Generate theses list (theses.json)
try {
  const folders = fs.readdirSync(THESES_DIR).filter(f => {
    return fs.statSync(path.join(THESES_DIR, f)).isDirectory();
  });

  const thesesMap = {};
  const theses = folders
    .map(f => parseThesis(f))
    .filter(t => t !== null);
  
  theses.forEach(t => {
    thesesMap[t.id] = t;
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'theses.json'), JSON.stringify(theses, null, 2));
  console.log('Successfully generated theses.json');

  // 2. Generate thesis detail for each (theses/{id}.json)
  const DETAIL_DIR = path.join(OUTPUT_DIR, 'theses');
  if (!fs.existsSync(DETAIL_DIR)) {
    fs.mkdirSync(DETAIL_DIR, { recursive: true });
  }

  folders.forEach(folderName => {
    const fullMdPath = path.join(THESES_DIR, folderName, 'Full.md');

    if (fs.existsSync(fullMdPath)) {
      const content = fs.readFileSync(fullMdPath, 'utf8');
      const baseInfo = thesesMap[folderName] || {};
      const detail = {
        ...baseInfo,
        content: md.render(content)
      };
      fs.writeFileSync(path.join(DETAIL_DIR, `${folderName}.json`), JSON.stringify(detail, null, 2));
      console.log(`Successfully generated ${folderName}.json`);
    } else {
      console.warn(`Detail file not found: ${fullMdPath}`);
    }
  });

} catch (err) {
  console.error('Error generating data:', err);
  process.exit(1);
}
