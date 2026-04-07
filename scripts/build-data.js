const fs = require('fs');
const path = require('path');
const https = require('https');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const THESES_DIR = path.join(__dirname, '../Theses');
const COMPANIES_DIR = path.join(__dirname, '../Companies');
const OUTPUT_DIR = path.join(__dirname, '../frontend/public/api');
const ASSETS_DIR = path.join(__dirname, '../frontend/public/theses-assets');
const COMPANIES_ASSETS_DIR = path.join(__dirname, '../frontend/public/companies-assets');

// Create output directories if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(COMPANIES_ASSETS_DIR)) fs.mkdirSync(COMPANIES_ASSETS_DIR, { recursive: true });

const COMPANIES_OUTPUT_DIR = path.join(OUTPUT_DIR, 'companies');
if (!fs.existsSync(COMPANIES_OUTPUT_DIR)) fs.mkdirSync(COMPANIES_OUTPUT_DIR, { recursive: true });

const companyMapping = {
  names: {}, // name.toLowerCase() -> id
  tickers: {}, // TICKER -> id
  aliases: {} // alias.toLowerCase() -> id
};

const companiesList = [];

// Function to simplify company names (e.g., "Cameco Corporation" -> "Cameco")
const getCompanyAliases = (fullName) => {
  const aliases = [];
  const commonSuffixes = [' Corporation', ' Corp.', ' Corp', ' Limited', ' Ltd.', ' Ltd', ' Inc.', ' Inc', ' Group', ' PLC', ' Co.', ' Co', ' SE', ' SA', ' AG', ' NV'];
  
  // List of common words that should NOT be used as standalone aliases
  const commonWords = ['Global', 'Energy', 'Uranium', 'Fission', 'Atomic', 'Mining', 'Resources', 'Metals', 'Materials', 'Systems', 'Technologies', 'Dynamics', 'Electric', 'Power', 'International', 'American', 'Canadian', 'Australian', 'Venture', 'Digital', 'Solutions', 'Holdings', 'Western', 'Deep', 'Southern', 'Northern', 'Central', 'Standard', 'Universal'];

  let simplified = fullName;
  commonSuffixes.forEach(suffix => {
    if (simplified.toLowerCase().endsWith(suffix.toLowerCase())) {
      simplified = simplified.substring(0, simplified.length - suffix.length).trim();
    }
  });

  if (simplified !== fullName && !commonWords.includes(simplified)) {
    // If the simplified name is still multiple words, we use it as an alias
    // If it's a single word, we only use it if it's not a common word
    aliases.push(simplified);
  }

  // Handle cases like "BHP Group" -> "BHP"
  const words = fullName.split(' ');
  const firstWord = words[0];
  
  // ONLY use the first word as an alias if the full name is essentially just that word + suffix
  // AND the first word is not a common word.
  // This avoids linking "Schneider" when "Schneider Electric" is the intent.
  if (words.length <= 3 && firstWord.length >= 3 && !aliases.includes(firstWord) && !commonWords.includes(firstWord)) {
    // Check if the other words are just suffixes
    const otherWords = words.slice(1);
    const areAllSuffixes = otherWords.every(w => 
      commonSuffixes.some(s => s.trim().toLowerCase() === w.toLowerCase())
    );
    
    if (areAllSuffixes) {
      aliases.push(firstWord);
    }
  }

  return aliases;
};

// 1. Process Companies
async function processCompanies() {
  if (fs.existsSync(COMPANIES_DIR)) {
    const companyFolders = fs.readdirSync(COMPANIES_DIR).filter(f => {
      return fs.statSync(path.join(COMPANIES_DIR, f)).isDirectory();
    });

    for (const folderName of companyFolders) {
      const profilePath = path.join(COMPANIES_DIR, folderName, 'Profile.md');
      if (fs.existsSync(profilePath)) {
        const content = fs.readFileSync(profilePath, 'utf8');
        const lines = content.split('\n');
        let name = '';
        let logoUrl = '';
        let website = '';
        let country = '';
        let type = '';
        let titleLineIndex = -1;
        const metadataIndices = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('# ')) {
            name = line.replace('# ', '').trim();
            titleLineIndex = i;
            metadataIndices.push(i);
          } else if (line.startsWith('**Logo:**')) {
            logoUrl = line.replace('**Logo:**', '').trim();
            metadataIndices.push(i);
          } else if (line.startsWith('**Website:**')) {
            const rawWebsite = line.replace('**Website:**', '').trim();
            const match = rawWebsite.match(/\[(.*?)\]\((.*?)\)/);
            website = match ? match[2] : rawWebsite;
            metadataIndices.push(i);
          } else if (line.startsWith('**Country:**')) {
            country = line.replace('**Country:**', '').trim();
            metadataIndices.push(i);
          } else if (line.startsWith('**Type:**')) {
            type = line.replace('**Type:**', '').trim();
            metadataIndices.push(i);
          }
        }

        /* 
        let localLogoUrl = '';
        if (logoUrl) {
          try {
            const companyAssetDir = path.join(COMPANIES_ASSETS_DIR, folderName);
            if (!fs.existsSync(companyAssetDir)) fs.mkdirSync(companyAssetDir, { recursive: true });
            
            // Extract extension
            let ext = logoUrl.split('.').pop().split(/[?#]/)[0];
            if (ext.length > 4) ext = 'png'; // Fallback if no extension in URL
            const logoFileName = `logo.${ext}`;
            const logoPath = path.join(companyAssetDir, logoFileName);
            
            await downloadFile(logoUrl, logoPath);
            localLogoUrl = `/companies-assets/${folderName}/${logoFileName}`;
            console.log(`Downloaded logo for ${folderName}`);
          } catch (err) {
            console.warn(`Failed to download logo for ${folderName}: ${err.message}`);
          }
        }
        */
        let localLogoUrl = logoUrl; // Just use the original URL if we want to show it, or set to empty string if preferred.


        // Create content without the metadata lines
        const contentWithoutMetadata = lines
          .filter((_, idx) => !metadataIndices.includes(idx))
          .join('\n');

        const ticker = folderName.split('.')[0];
        const detail = {
          id: folderName,
          name,
          ticker,
          logoUrl: localLogoUrl,
          website,
          country,
          type,
          content: md.render(contentWithoutMetadata)
        };
        fs.writeFileSync(path.join(COMPANIES_OUTPUT_DIR, `${folderName}.json`), JSON.stringify(detail, null, 2));
        console.log(`Successfully generated company ${folderName}.json`);

        if (name) {
          companyMapping.names[name.toLowerCase()] = folderName;
          const aliases = getCompanyAliases(name);
          aliases.forEach(alias => {
            companyMapping.aliases[alias.toLowerCase()] = folderName;
          });
        }
        companyMapping.tickers[ticker] = folderName;

        companiesList.push({
          id: folderName,
          name,
          ticker,
          website,
          country,
          type
        });
      }
    }

    // Sort companies alphabetically
    companiesList.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'companies.json'), JSON.stringify(companiesList, null, 2));
    console.log('Successfully generated companies.json');
  }
}

// Helper to replace company names/tickers with links in markdown
const linkifyCompanies = (content) => {
  if (!content) return content;
  
  // To be safe, we also exclude common terms that happen to be tickers
  const excludedTickers = ['HBM', 'SMR', 'EU', 'LNG'];
  
  // Context keywords that allow a standalone ticker to be linked
  const contextKeywords = ['Ticker', 'Symbol', 'NYSE', 'NASDAQ', 'ASX', 'TSX', 'LSE', 'ETR', 'SIX', 'HK', 'OTC', 'BIT', 'ST', 'OSL', 'EPA', 'CSE'];

  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    let newLine = line;
    
    // Skip already linked lines, markdown headers, and table headers
    if (line.includes('](/company/')) return line;
    if (line.trim().startsWith('#')) return line;
    if (line.trim().startsWith('|') && (line.toLowerCase().includes('ticker') || line.includes('---'))) return line;

    // Keep track of which companies (by ID) we've already linked on this line
    const linkedIdsOnThisLine = new Set();

    // First, try to link by FULL Name (exact matches are highest priority)
    const fullNames = Object.keys(companyMapping.names).sort((a, b) => b.length - a.length);
    for (const name of fullNames) {
      const id = companyMapping.names[name];
      if (!id || linkedIdsOnThisLine.has(id)) continue;

      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Case-insensitive match for name
      const nameRegex = new RegExp(`(?<!\\[|/|\\()\\b${escapedName}\\b(?![\\]\\)/])`, 'gi');
      
      if (nameRegex.test(newLine)) {
        newLine = newLine.replace(nameRegex, (match) => `[${match}](/company/${id})`);
        linkedIdsOnThisLine.add(id);
      }
    }

    // Then, try to link by Alias (longer matches first)
    const aliases = Object.keys(companyMapping.aliases).sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const id = companyMapping.aliases[alias];
      if (!id || linkedIdsOnThisLine.has(id)) continue;

      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Case-insensitive match for alias
      const aliasRegex = new RegExp(`(?<!\\[|/|\\()\\b${escapedAlias}\\b(?![\\]\\)/])`, 'gi');
      
      if (aliasRegex.test(newLine)) {
        newLine = newLine.replace(aliasRegex, (match) => `[${match}](/company/${id})`);
        linkedIdsOnThisLine.add(id);
      }
    }

    // Then, try to link by Ticker if not already linked for that company and if context exists
    const tickers = Object.keys(companyMapping.tickers).sort((a, b) => b.length - a.length);
    for (const ticker of tickers) {
      if (excludedTickers.includes(ticker)) continue;
      
      const id = companyMapping.tickers[ticker];
      
      // If this line already contains a link to this company, skip ticker linking
      if (linkedIdsOnThisLine.has(id)) continue;

      const tickerRegex = new RegExp(`(?<!\\[|/|\\()\\b${ticker}\\b(?![\\]\\)/])`, 'g');
      
      if (tickerRegex.test(newLine)) {
        const hasContext = contextKeywords.some(kw => newLine.includes(kw));
        if (hasContext) {
          newLine = newLine.replace(tickerRegex, (match) => `[${match}](/company/${id})`);
          linkedIdsOnThisLine.add(id);
        }
      }
    }

    return newLine;
  });

  return processedLines.join('\n');
};

// 2. Helper to parse thesis file
const parseThesis = (folderName) => {
  const folderPath = path.join(THESES_DIR, folderName);
  const shortMdPath = path.join(folderPath, 'Short.md');
  
  if (!fs.existsSync(shortMdPath)) return null;

  const content = fs.readFileSync(shortMdPath, 'utf8');
  const lines = content.split('\n');
  
  let title = '';
  let theme = '';
  let summary = '';
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (line.startsWith('# ')) {
      title = line.replace('# ', '').trim();
    } else if (trimmedLine.startsWith('### Theme')) {
      currentSection = 'theme';
    } else if (trimmedLine.startsWith('### Executive Summary')) {
      currentSection = 'summary';
    } else if (currentSection && trimmedLine.startsWith('###')) {
      currentSection = '';
    } else if (currentSection) {
      if (trimmedLine !== '') {
        if (currentSection === 'theme') {
          theme += line + '\n';
        } else if (currentSection === 'summary') {
          summary += line + '\n';
        }
      }
    }
  }

  theme = theme.trim();
  summary = summary.trim();

  const cardImagePath = path.join(folderPath, 'CardImage.jpg');
  let imageUrl = '';
  if (fs.existsSync(cardImagePath)) {
    const targetImagePath = path.join(ASSETS_DIR, `${folderName}.jpg`);
    fs.copyFileSync(cardImagePath, targetImagePath);
    imageUrl = `/theses-assets/${folderName}.jpg`;
  }

  return {
    id: folderName,
    title,
    theme: theme.trim(),
    summary: summary.trim(),
    imageUrl
  };
};

// Main execution
async function main() {
  try {
    await processCompanies();

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

    const DETAIL_DIR = path.join(OUTPUT_DIR, 'theses');
    if (!fs.existsSync(DETAIL_DIR)) fs.mkdirSync(DETAIL_DIR, { recursive: true });

    folders.forEach(folderName => {
      const fullMdPath = path.join(THESES_DIR, folderName, 'Full.md');
      const tabsDirPath = path.join(THESES_DIR, folderName, 'Tabs');

      if (fs.existsSync(fullMdPath)) {
        let content = fs.readFileSync(fullMdPath, 'utf8');
        content = linkifyCompanies(content);

        const baseInfo = thesesMap[folderName] || {};
        
        const tabs = [];
        if (fs.existsSync(tabsDirPath) && fs.statSync(tabsDirPath).isDirectory()) {
          const tabFiles = fs.readdirSync(tabsDirPath).filter(f => f.endsWith('.md'));
          tabFiles.forEach(tabFile => {
            let tabContent = fs.readFileSync(path.join(tabsDirPath, tabFile), 'utf8');
            tabContent = linkifyCompanies(tabContent);
            tabs.push({
              label: tabFile.replace('.md', ''),
              content: md.render(tabContent)
            });
          });
        }

        const detail = {
          ...baseInfo,
          content: md.render(content),
          tabs: tabs.length > 0 ? tabs : undefined
        };
        fs.writeFileSync(path.join(DETAIL_DIR, `${folderName}.json`), JSON.stringify(detail, null, 2));
        console.log(`Successfully generated ${folderName}.json`);
      }
    });

    // 3. Process Sources
    const sourcesPath = path.join(THESES_DIR, 'Sources.md');
    if (fs.existsSync(sourcesPath)) {
      let sourcesContent = fs.readFileSync(sourcesPath, 'utf8');
      sourcesContent = linkifyCompanies(sourcesContent);
      const sourcesData = {
        title: 'Sources',
        content: md.render(sourcesContent)
      };
      fs.writeFileSync(path.join(OUTPUT_DIR, 'sources.json'), JSON.stringify(sourcesData, null, 2));
      console.log('Successfully generated sources.json');
    }

  } catch (err) {
    console.error('Error generating data:', err);
    process.exit(1);
  }
}

main();
