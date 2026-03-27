const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();
const app = express();

const THESES_DIR = path.join(__dirname, 'Theses');

app.use(cors({ origin: true }));
app.use(express.json());

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
                // Return relative path since Hosting serves assets from /theses-assets/
                imageUrl = `/theses-assets/${imageUrl}`;
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
        console.error('Error reading theses:', err);
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

// Export the app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
