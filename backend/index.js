const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const app = express();
const PORT = process.env.PORT || 5000;

const THESES_DIR = path.join(__dirname, '../Theses');

app.use(cors());
app.use(express.json());
app.use('/theses-assets', express.static(THESES_DIR));

// Helper to parse thesis file
const parseThesis = (filename) => {
    const filePath = path.join(THESES_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let title = '';
    let summary = '';
    let imageUrl = '';
    let readingSummary = false;

    for (const line of lines) {
        if (line.startsWith('# ')) {
            title = line.replace('# ', '').trim();
        } else if (line.startsWith('Image: ')) {
            imageUrl = line.replace('Image: ', '').trim();
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `http://localhost:5000/theses-assets/${imageUrl}`;
            }
        } else if (line.includes('Executive Summary')) {
            readingSummary = true;
        } else if (readingSummary) {
            if (line.trim() !== '') {
                summary += line + '\n';
            }
        }
    }

    return {
        id: filename.replace('.md', ''),
        title,
        summary: summary.trim(),
        imageUrl,
        filename
    };
};

app.get('/api/theses', (req, res) => {
    try {
        const files = fs.readdirSync(THESES_DIR);
        const theses = files
            .filter(f => f.startsWith('Thesis ') && !f.includes('detail') && f.endsWith('.md'))
            .map(f => parseThesis(f));
        res.json(theses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read theses' });
    }
});

app.get('/api/theses/:id', (req, res) => {
    const { id } = req.params;
    const detailFile = `${id} detail.md`;
    const detailPath = path.join(THESES_DIR, detailFile);

    if (fs.existsSync(detailPath)) {
        const content = fs.readFileSync(detailPath, 'utf8');
        res.json({ id, content: md.render(content) });
    } else {
        res.status(404).json({ error: 'Detail not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
