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

const companiesList = [];

// 1. Process Companies
async function processCompanies() {
  if (fs.existsSync(COMPANIES_DIR)) {
    const companyFolders = fs.readdirSync(COMPANIES_DIR).filter(f => {
      return fs.statSync(path.join(COMPANIES_DIR, f)).isDirectory();
    });

    for (const folderName of companyFolders) {
      const profileJsonPath = path.join(COMPANIES_DIR, folderName, 'Profile.json');
      
      let name = '';
      let logoUrl = '';
      let website = '';
      let country = '';
      let type = '';
      let description = '';
      let ticker = folderName.split('.')[0];
      let investment_theses = [];

      if (fs.existsSync(profileJsonPath)) {
        try {
          const profile = JSON.parse(fs.readFileSync(profileJsonPath, 'utf8'));
          ticker = profile.ticker || ticker;
          name = profile.name;
          if (!name && profile.description) {
              const match = profile.description.match(/^([^.,]+?)\s+(?:is a|provides|builds|pioneered)/i);
              if (match) name = match[1].trim();
          }
          if (!name) name = ticker;

          logoUrl = profile.logo_url || '';
          
          // Handle local logo
          if (profile.logo_local) {
            const localLogoPath = path.join(COMPANIES_DIR, folderName, profile.logo_local);
            if (fs.existsSync(localLogoPath)) {
              const extension = path.extname(profile.logo_local);
              const targetLogoName = `${folderName}${extension}`;
              const targetLogoPath = path.join(COMPANIES_ASSETS_DIR, targetLogoName);
              fs.copyFileSync(localLogoPath, targetLogoPath);
              logoUrl = `/companies-assets/${targetLogoName}`;
            }
          }

          website = profile.website || '';
          country = profile.country_of_domicile || '';
          description = profile.description || '';
          investment_theses = profile.investment_theses || [];
          
          if (investment_theses.length > 0) {
              type = investment_theses[0].company_type;
          }
        } catch (e) {
          console.error(`Error parsing ${profileJsonPath}:`, e.message);
        }
      }

      if (name) {
        const detail = {
          id: folderName,
          name,
          ticker,
          logoUrl,
          website,
          country,
          type,
          investment_theses,
          content: md.render(description)
        };
        fs.writeFileSync(path.join(COMPANIES_OUTPUT_DIR, `${folderName}.json`), JSON.stringify(detail, null, 2));
        console.log(`Successfully generated company ${folderName}.json`);

        companiesList.push({
          id: folderName,
          name,
          ticker,
          logoUrl, // Added logoUrl to the list
          website,
          country,
          type,
          investment_theses
        });
      }
    }

    // Sort companies alphabetically
    companiesList.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'companies.json'), JSON.stringify(companiesList, null, 2));
    console.log('Successfully generated companies.json');
  }
}

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
        const baseInfo = thesesMap[folderName] || {};
        const tabs = [];
        if (fs.existsSync(tabsDirPath) && fs.statSync(tabsDirPath).isDirectory()) {
          const tabFiles = fs.readdirSync(tabsDirPath).filter(f => f.endsWith('.md'));
          tabFiles.forEach(tabFile => {
            let tabContent = fs.readFileSync(path.join(tabsDirPath, tabFile), 'utf8');
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
