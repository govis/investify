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

    return {
        id: folderName,
        title,
        summary: summary.trim(),
        imageUrl: `http://localhost:${PORT}/api/theses/${folderName}/image`
    };
};

app.get('/api/theses', (req, res) => {
    try {
        const folders = fs.readdirSync(THESES_DIR).filter(f => {
            return fs.statSync(path.join(THESES_DIR, f)).isDirectory();
        });

        const theses = folders
            .map(f => parseThesis(f))
            .filter(t => t !== null);
        res.json(theses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read theses' });
    }
});

app.get('/api/theses/:id', (req, res) => {
    const { id } = req.params;
    const fullMdPath = path.join(THESES_DIR, id, 'Full.md');

    if (fs.existsSync(fullMdPath)) {
        const content = fs.readFileSync(fullMdPath, 'utf8');
        res.json({ id, content: md.render(content) });
    } else {
        res.status(404).json({ error: 'Detail not found' });
    }
});

app.get('/api/theses/:id/image', (req, res) => {
    const { id } = req.params;
    const imagePath = path.join(THESES_DIR, id, 'CardImage.jpg');

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: 'Image not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
