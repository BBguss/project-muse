import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

// ===== FIX __dirname for ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =================================
const app = express();
const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOAD_DIR));

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created root upload directory: ${UPLOAD_DIR}`);
}

/**
 * POST /api/upload
 */
app.post('/api/upload', (req, res) => {
  try {
    const { user, image } = req.body;

    if (!user || !image) {
      return res.status(400).json({ error: 'User and image data required' });
    }

    const safeUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOAD_DIR, safeUser);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const filePath = path.join(userDir, filename);

    fs.writeFileSync(filePath, buffer);

    console.log(`Saved image for ${user}: ${filename}`);
    res.json({
      success: true,
      path: `/uploads/${safeUser}/${filename}`
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

/**
 * GET /api/images/:user
 */
app.get('/api/images/:user', (req, res) => {
  try {
    const { user } = req.params;
    const safeUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
    const userDir = path.join(UPLOAD_DIR, safeUser);

    if (!fs.existsSync(userDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(userDir)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
      .map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/uploads/${safeUser}/${file}`,
        timestamp: Number(file.split('.')[0]) || 0
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json({ images: files });

  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

app.listen(PORT, () => {
  console.log('--------------------------------------------------');
  console.log(`Local Storage Server running at http://localhost:${PORT}`);
  console.log(`Images saved in: ${UPLOAD_DIR}`);
  console.log('--------------------------------------------------');
});