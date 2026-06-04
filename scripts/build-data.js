const fs = require('fs');
const path = require('path');
const https = require('https');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const THESES_DIR = path.join(__dirname, '../Theses');
const COMPANIES_DIR = path.join(__dirname, '../Companies');
const MANAGERS_DIR = path.join(__dirname, '../Managers');
const OUTPUT_DIR = path.join(__dirname, '../frontend/public/api');
const ASSETS_DIR = path.join(__dirname, '../frontend/public/theses-assets');
const COMPANIES_ASSETS_DIR = path.join(__dirname, '../frontend/public/companies-assets');
const MANAGERS_ASSETS_DIR = path.join(__dirname, '../frontend/public/managers-assets');

// Helper to format date
function formatTenureDate(dateStr) {
  if (!dateStr) return '';
  
  const cleanDate = dateStr.trim();
  if (['Unknown', '~', 'None', 'N/A', 'null', 'undefined'].includes(cleanDate)) return '';
  
  // Handle YYYY-MM-DD or YYYY-MM
  if (cleanDate.includes('-')) {
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (month >= 1 && month <= 12) {
      return `${months[month - 1]} ${year}`;
    }
    return year;
  }

  // Handle "Month YYYY"
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthMatch = dateStr.match(new RegExp(`(${months.join('|')})\\s+(\\d{4})`, 'i'));
  if (monthMatch) {
    const month = monthMatch[1];
    const year = monthMatch[2];
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return `${capitalizedMonth} ${year}`;
  }

  // If it's just YYYY
  if (/^\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  return dateStr;
}

// Create output directories if they don't exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(COMPANIES_ASSETS_DIR)) fs.mkdirSync(COMPANIES_ASSETS_DIR, { recursive: true });
if (!fs.existsSync(MANAGERS_ASSETS_DIR)) fs.mkdirSync(MANAGERS_ASSETS_DIR, { recursive: true });

const COMPANIES_OUTPUT_DIR = path.join(OUTPUT_DIR, 'companies');
if (!fs.existsSync(COMPANIES_OUTPUT_DIR)) fs.mkdirSync(COMPANIES_OUTPUT_DIR, { recursive: true });

const MANAGERS_OUTPUT_DIR = path.join(OUTPUT_DIR, 'managers');
if (!fs.existsSync(MANAGERS_OUTPUT_DIR)) fs.mkdirSync(MANAGERS_OUTPUT_DIR, { recursive: true });

const companiesList = [];
const companyWebsites = {}; // Added to track websites for manager linking
const companyLogos = {}; // Added to track logos for manager linking

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
          companyWebsites[folderName] = website; // Store website mapping
          companyLogos[folderName] = logoUrl; // Store logo mapping
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
        const tabs = [];
        const managementPath = path.join(COMPANIES_DIR, folderName, 'Management.json');
        if (fs.existsSync(managementPath)) {
          try {
            const management = JSON.parse(fs.readFileSync(managementPath, 'utf8'));
            let managementHtml = '';
            
            if (management.executives && management.executives.length > 0) {
              managementHtml += '<h2 style="margin-top: 0; margin-bottom: 24px;">Officers</h2>';
              management.executives.forEach(exec => {
                const startDate = (exec.tenure_dates && exec.tenure_dates.length > 0) ? exec.tenure_dates[0].start_date : null;
                const formattedDate = formatTenureDate(startDate);
                
                managementHtml += `<div style="margin-bottom: 32px; padding: 20px; background-color: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">`;
                managementHtml += `<h3 style="margin-top: 0; margin-bottom: 8px; font-size: 1.25rem;"><a href="/manager/${encodeURIComponent(exec.name)}" style="color: inherit; text-decoration: none; border-bottom: 1px dashed #0066cc;">${exec.name}</a>${formattedDate ? `<span style="color: #666; font-weight: normal; font-size: 1rem; margin-left: 8px;">${formattedDate}</span>` : ''}</h3>`;
                if (exec.tenure_dates && exec.tenure_dates.length > 0) {
                  managementHtml += `<p style="margin-top: 0; margin-bottom: 12px; color: #0066cc; font-weight: 600;">${exec.tenure_dates[0].title}</p>`;
                }
                managementHtml += `<p style="margin-bottom: 0; line-height: 1.6; font-size: 1rem; color: #333;">${exec.background}</p>`;
                managementHtml += `</div>`;
              });
            }

            if (management.board_of_directors && management.board_of_directors.length > 0) {
              managementHtml += '<h2 style="margin-top: 40px; margin-bottom: 24px;">Directors</h2>';
              management.board_of_directors.forEach(dir => {
                const startDate = (dir.tenure_dates && dir.tenure_dates.length > 0) ? dir.tenure_dates[0].start_date : null;
                const formattedDate = formatTenureDate(startDate);

                managementHtml += `<div style="margin-bottom: 32px; padding: 20px; background-color: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">`;
                managementHtml += `<h3 style="margin-top: 0; margin-bottom: 8px; font-size: 1.25rem;"><a href="/manager/${encodeURIComponent(dir.name)}" style="color: inherit; text-decoration: none; border-bottom: 1px dashed #0066cc;">${dir.name}</a>${formattedDate ? `<span style="color: #666; font-weight: normal; font-size: 1rem; margin-left: 8px;">${formattedDate}</span>` : ''}</h3>`;
                if (dir.tenure_dates && dir.tenure_dates.length > 0) {
                  managementHtml += `<p style="margin-top: 0; margin-bottom: 12px; color: #0066cc; font-weight: 600;">${dir.tenure_dates[0].role || dir.tenure_dates[0].title}</p>`;
                }
                managementHtml += `<p style="margin-bottom: 0; line-height: 1.6; font-size: 1rem; color: #333;">${dir.background}</p>`;
                managementHtml += `</div>`;
              });
            }

            if (management.sources && management.sources.length > 0) {
              managementHtml += '<h2 style="margin-top: 40px; margin-bottom: 16px;">Sources</h2>';
              managementHtml += '<ul style="padding-left: 20px; line-height: 1.6;">';
              management.sources.forEach(src => {
                managementHtml += `<li style="margin-bottom: 8px; color: #333;">`;
                managementHtml += `<a href="${src.source_url}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: none;">${src.source_description}</a>`;
                if (src.as_of_date) {
                  managementHtml += `<span style="color: #666; font-size: 0.9rem; margin-left: 8px;">(As of: ${src.as_of_date})</span>`;
                }
                managementHtml += `</li>`;
              });
              managementHtml += '</ul>';
            }

            if (managementHtml) {
              tabs.push({
                label: 'Management',
                content: managementHtml
              });
            }
          } catch (e) {
            console.error(`Error parsing ${managementPath}:`, e.message);
          }
        }

        const detail = {
          id: folderName,
          name,
          ticker,
          logoUrl,
          website,
          country,
          type,
          investment_theses,
          content: md.render(description),
          tabs: tabs.length > 0 ? tabs : undefined
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

// 2. Process Managers
async function processManagers() {
  const managersList = [];
  if (fs.existsSync(MANAGERS_DIR)) {
    const managerFolders = fs.readdirSync(MANAGERS_DIR).filter(f => {
      return fs.statSync(path.join(MANAGERS_DIR, f)).isDirectory();
    });

    for (const folderName of managerFolders) {
      const profileJsonPath = path.join(MANAGERS_DIR, folderName, 'Profile.json');
      
      if (fs.existsSync(profileJsonPath)) {
        try {
          const profile = JSON.parse(fs.readFileSync(profileJsonPath, 'utf8'));
          
          let pictureUrl = profile.picture_url || null;
          
          // Handle local picture
          if (profile.picture_local) {
            const localPicturePath = path.join(MANAGERS_DIR, folderName, profile.picture_local);
            if (fs.existsSync(localPicturePath)) {
              const extension = path.extname(profile.picture_local);
              const targetPictureName = `${folderName}${extension}`;
              const targetPicturePath = path.join(MANAGERS_ASSETS_DIR, targetPictureName);
              fs.copyFileSync(localPicturePath, targetPicturePath);
              pictureUrl = `/managers-assets/${targetPictureName}`;
            }
          }

          // Filter for validated affiliations
          const companies = (profile.company_affiliations || []).filter(c => c.validated === true);
          
          const managerData = {
            id: folderName,
            name: profile.name,
            background: profile.background,
            pictureUrl: pictureUrl,
            companies: companies.map(c => {
              const companyId = `${c.ticker}.${c.exchange}`;
              return {
                name: c.name,
                ticker: c.ticker,
                exchange: c.exchange,
                website: companyWebsites[companyId] || null,
                logoUrl: companyLogos[companyId] || null,
                title: c.title_or_role,
                startDate: c.start_date,
                endDate: c.end_date,
                formattedStartDate: formatTenureDate(c.start_date),
                formattedEndDate: formatTenureDate(c.end_date)
              };
            }),
            investmentTheses: profile.investment_theses || [],
            socials: profile.socials || [],
            committees: profile.committees || [],
            age: profile.age,
            ageYear: profile.age_year
          };

          fs.writeFileSync(path.join(MANAGERS_OUTPUT_DIR, `${folderName}.json`), JSON.stringify(managerData, null, 2));
          console.log(`Successfully generated manager ${folderName}.json`);

          // Sort companies for the summary list: current roles first, then by start date descending
          const sortedCompanies = [...companies].sort((a, b) => {
            const aIsCurrent = !a.end_date || a.end_date === 'Present';
            const bIsCurrent = !b.end_date || b.end_date === 'Present';
            
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            
            // If both are current or both are past, sort by start date descending
            const aStart = a.start_date || '';
            const bStart = b.start_date || '';
            return bStart.localeCompare(aStart);
          });

          managersList.push({
            name: profile.name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            pictureUrl: pictureUrl,
            companies: sortedCompanies.slice(0, 2).map(c => ({
              name: c.name,
              ticker: c.ticker,
              exchange: c.exchange,
              role: c.title_or_role
            })),
            investment_theses: profile.investment_theses || []
          });
        } catch (e) {
          console.error(`Error parsing manager ${profileJsonPath}:`, e.message);
        }
      }
    }
    
    // Sort managers by name
    managersList.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'managers.json'), JSON.stringify(managersList, null, 2));
    console.log('Successfully generated managers.json');
  }
}

// 3. Helper to parse thesis file
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
    await processManagers();

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
