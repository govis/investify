const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, '../config.json');
let EXPANDED_MATCH_REQUIRED = [];
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.EXPANDED_MATCH_REQUIRED) {
      EXPANDED_MATCH_REQUIRED = config.EXPANDED_MATCH_REQUIRED.map(s => s.toUpperCase());
    }
  } catch (e) {
    console.error('Error parsing config.json:', e.message);
  }
}

const THESES_DIR = path.join(__dirname, '../Theses');
const COMPANIES_DIR = path.join(__dirname, '../Companies');
const COMPANY_LIST_PATH = path.join(__dirname, '../CompanyList.json');

const commonWords = new Set([
  'THE', 'ON', 'ARE', 'OR', 'IS', 'AM', 'TO', 'FOR', 'BY', 'IN', 'OF', 'AT', 'IF', 'BUT', 'SO', 'AS', 'IT', 'US', 'BE', 'DO', 'GO', 'AN', 'ALL', 'CAN', 'NET', 'RUN', 'X', 'S', 'D',
  'UNITED', 'NATIONAL', 'FIRST', 'NOW', 'ADVANCED', 'GENERAL', 'SCIENCE', 'POWER', 'ENERGY', 'NEW', 'GLOBAL', 'INTERNATIONAL', 'AMERICAN', 'SYSTEMS', 'TECHNOLOGIES', 'GROUP', 'SOLUTIONS', 'RESOURCES', 'MATERIALS', 'METALS', 'MINING', 'ELECTRIC', 'DYNAMICS', 'DIGITAL', 'STANDARD', 'PRO', 'HIGH', 'LOW', 'TOP', 'GREAT', 'LEADER', 'SERVICE', 'UNITED STATES', 'U.S.', 'TAIWAN', 'JAPAN', 'SOUTH KOREA', 'EUROPE'
]);

const companyMapping = [];
const folderSet = new Set();

function buildMapping() {
  if (!fs.existsSync(COMPANY_LIST_PATH)) return;

  const list = JSON.parse(fs.readFileSync(COMPANY_LIST_PATH, 'utf8'));
  const folders = fs.readdirSync(COMPANIES_DIR).filter(f => fs.statSync(path.join(COMPANIES_DIR, f)).isDirectory());
  folders.forEach(f => folderSet.add(f));

  list.forEach(item => {
    const ticker = item.ticker;
    const exchange = item.exchange;
    let folderId = `${ticker}.${exchange}`;
    
    if (!folderSet.has(folderId)) {
        const potential = folders.find(f => f.startsWith(ticker + '.') || f.startsWith(ticker + '..'));
        if (potential) folderId = potential;
    }

    if (folderSet.has(folderId)) {
      const profilePath = path.join(COMPANIES_DIR, folderId, 'Profile.json');
      let nameClean = item.name.replace(/ (Corporation|Corp\.|Corp|Limited|Ltd\.|Ltd|Inc\.|Inc|Group|PLC|Co\.|Co|Company|SE|SA|AG|NV)$/i, '').trim();
      let companyTheses = (item.theses || []).map(t => t.thesis_name);

      if (fs.existsSync(profilePath)) {
        try {
          const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
          if (profile.name_clean) nameClean = profile.name_clean;
          if (profile.investment_theses) {
            companyTheses = profile.investment_theses.map(t => t.thesis_name);
          }
        } catch (e) {
          console.error(`Error reading Profile.json for ${folderId}`);
        }
      }

      const entry = {
        id: folderId,
        nameClean: nameClean,
        ticker: ticker,
        theses: companyTheses,
        aliases: new Set()
      };

      if (nameClean.length > 2 && !commonWords.has(nameClean.toUpperCase())) {
          entry.aliases.add(nameClean);
      }
      
      if (ticker === 'MSFT') entry.aliases.add('Microsoft');
      if (ticker === 'GOOGL' || ticker === 'GOOG') {
          entry.aliases.add('Google');
          entry.aliases.add('Alphabet');
      }
      if (ticker === 'META') entry.aliases.add('Meta');
      if (ticker === 'AMZN') entry.aliases.add('Amazon');
      if (ticker === 'NVDA') entry.aliases.add('Nvidia');
      if (ticker === 'TSLA') entry.aliases.add('Tesla');
      if (ticker === 'AAPL') entry.aliases.add('Apple');

      entry.aliasesArr = Array.from(entry.aliases).sort((a, b) => b.length - a.length);
      companyMapping.push(entry);
    }
  });

  companyMapping.sort((a, b) => b.nameClean.length - a.nameClean.length);
}

const contextKeywords = ['Ticker', 'Symbol', 'NYSE', 'NASDAQ', 'ASX', 'TSX', 'LSE', 'ETR', 'SIX', 'HK', 'OTC', 'BIT', 'ST', 'OSL', 'EPA', 'CSE'];

// Mode 1: Verify and Cleanup
function verifyAndCleanup(content, filePath) {
    // 1. Remove links from Short.md files
    if (path.basename(filePath).toLowerCase() === 'short.md') {
        return content.replace(/\[([^\]]+)\]\(\/company\/[^)]+\)/g, '$1');
    }

    let updatedContent = content;

    // 2. Remove invalid links (missing Profile.json)
    const linkRegex = /\[([^\]]+)\]\(\/company\/([^)]+)\)/g;
    updatedContent = updatedContent.replace(linkRegex, (match, text, id) => {
        const profilePath = path.join(COMPANIES_DIR, id, 'Profile.json');
        if (!fs.existsSync(profilePath)) {
            console.log(`Removing invalid link: ${id} in ${filePath}`);
            return text;
        }
        return match;
    });

    // 3. Resolve double links: [Name](/company/ID) ([Ticker](/company/ID)) -> [Name](/company/ID) (Ticker)
    const doubleLinkRegex = /\[([^\]]+)\]\(\/company\/([^)]+)\)\s*([\(\[\\-]?)\s*\[([^\]]+)\]\(\/company\/([^)]+)\)\s*([\)\]]?)/g;
    updatedContent = updatedContent.replace(doubleLinkRegex, (match, name, id1, prefix, ticker, id2, suffix) => {
        if (id1 === id2) {
            return `[${name}](/company/${id1})${prefix ? ' ' + prefix : ' ('}${ticker}${suffix || ')'}`;
        }
        return match;
    });

    return updatedContent;
}

// Modes 2 & 3: Linking Logic
function linkifyV2(content, currentThesis) {
    let cleanContent = content.replace(/\[([^\]]+)\]\(\/company\/[^)]+\)/g, '$1');
    const applicableCompanies = companyMapping.filter(c => c.theses.includes(currentThesis));
    const lines = cleanContent.split('\n');
    
    const companyStats = new Map();

    lines.forEach((line, lineIdx) => {
        if (line.trim().startsWith('#')) return;
        
        applicableCompanies.forEach(company => {
            if (!companyStats.has(company.id)) {
                companyStats.set(company.id, { total: 0, first: null, both: [] });
            }
            const stats = companyStats.get(company.id);

            company.aliasesArr.forEach(alias => {
                const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(${escapedAlias})\\s*[\\(\\[\\-]\\s*(${company.ticker})\\s*[\\)\\]]?`, 'gi');
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const occ = { lineIdx, start: match.index, end: match.index + match[0].length, type: 'both', nameText: match[1], fullText: match[0] };
                    stats.total++;
                    if (!stats.first) stats.first = occ;
                    stats.both.push(occ);
                }
            });

            company.aliasesArr.forEach(alias => {
                const aliasUpper = alias.toUpperCase();
                if (EXPANDED_MATCH_REQUIRED.some(req => aliasUpper === req || aliasUpper.startsWith(req + ' '))) return;
                const words = alias.split(/\s+/);
                const isMultiWord = words.length >= 2;
                if (!isMultiWord && commonWords.has(aliasUpper)) return;
                const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`(?<!\\[|/)\\b${escapedAlias}\\b(?![\\ ]/]|\\w)`, 'gi');
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    const isOverlap = stats.both.some(o => o.lineIdx === lineIdx && match.index >= o.start && match.index < o.end);
                    if (!isOverlap) {
                        const occ = { lineIdx, start: match.index, end: match.index + match[0].length, type: 'name', nameText: match[0], fullText: match[0] };
                        stats.total++;
                        if (!stats.first) stats.first = occ;
                    }
                }
            });

            const tickerRegex = new RegExp(`(?<!\\[|/|\\()\\b${company.ticker}\\b(?![\\]\\)/])`, 'g');
            let match;
            while ((match = tickerRegex.exec(line)) !== null) {
                const isOverlap = stats.both.some(o => o.lineIdx === lineIdx && match.index >= o.start && match.index < o.end);
                if (!isOverlap) {
                    const hasExplicitContext = contextKeywords.some(kw => line.includes(kw)) || 
                                               /Ticker|Symbol/i.test(line) ||
                                               new RegExp(`\\(${company.ticker}\\)`, 'i').test(line);
                    if (hasExplicitContext) {
                        const occ = { lineIdx, start: match.index, end: match.index + match[0].length, type: 'ticker', nameText: match[0], fullText: match[0] };
                        stats.total++;
                        if (!stats.first) stats.first = occ;
                    }
                }
            }
        });
    });

    const toLink = [];
    companyStats.forEach((stats, companyId) => {
        if (stats.total === 0) return;
        if (stats.total < 5) {
            if (stats.first) toLink.push({ ...stats.first, companyId });
        } else {
            stats.both.forEach(occ => toLink.push({ ...occ, companyId }));
        }
    });

    toLink.sort((a, b) => {
        if (a.lineIdx !== b.lineIdx) return b.lineIdx - a.lineIdx;
        return b.start - a.start;
    });

    const finalLines = [...lines];
    toLink.forEach(occ => {
        const line = finalLines[occ.lineIdx];
        const before = line.substring(0, occ.start);
        const matchPart = line.substring(occ.start, occ.end);
        const after = line.substring(occ.end);

        if (occ.type === 'both') {
            const linked = matchPart.replace(occ.nameText, `[${occ.nameText}](/company/${occ.companyId})`);
            finalLines[occ.lineIdx] = before + linked + after;
        } else {
            finalLines[occ.lineIdx] = before + `[${matchPart}](/company/${occ.companyId})` + after;
        }
    });

    return finalLines.join('\n');
}

function processFiles(dir, mode, currentThesis = null) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      const nextThesis = (dir === THESES_DIR) ? item : currentThesis;
      processFiles(fullPath, mode, nextThesis);
    } else if (item.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      let updatedContent = content;

      if (mode === 'verify') {
          updatedContent = verifyAndCleanup(content, fullPath);
      } else if (mode === 'reverse' || mode === 'thesis') {
          if (!currentThesis) return;
          console.log(`Linking ${fullPath} (Thesis: ${currentThesis})...`);
          updatedContent = linkifyV2(content, currentThesis);
      }

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  });
}

// Get mode from command line: node scripts/link-companies.js --mode=verify|reverse|thesis
const args = process.argv.slice(2);
let mode = 'verify'; // Default
args.forEach(arg => {
    if (arg.startsWith('--mode=')) {
        mode = arg.split('=')[1];
    }
});

console.log(`Running in Mode: ${mode}`);
buildMapping();
processFiles(THESES_DIR, mode);
console.log('Done!');
