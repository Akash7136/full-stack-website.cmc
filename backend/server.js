require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
const connectDB = require('./config/db');
const Comparison = require('./models/Comparison');
const { analyzeResumeAndJD } = require('./utils/resumeAnalyzer');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PDF files are allowed.'));
  },
});

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Resume comparison API is running',
    mongoConnected: mongoose.connection.readyState === 1,
  });
});

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume PDF.' });
    }

    const jdText = req.body.jd || '';
    if (!jdText.trim()) {
      return res.status(400).json({ message: 'Please provide a job description for comparison.' });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    let resumeText;
    try {
      const pdfData = await parser.getText();
      resumeText = pdfData.text || '';
    } finally {
      await parser.destroy();
    }

    if (!resumeText.trim()) {
      return res.status(400).json({ message: 'No readable text found in the uploaded PDF.' });
    }

    const analysis = analyzeResumeAndJD(resumeText, jdText);

    let savedComparison = null;
    if (mongoose.connection.readyState === 1) {
      try {
        savedComparison = await Comparison.create({
          resumeFileName: req.file.originalname,
          jdText,
          score: analysis.score,
          matchedSkills: analysis.matchedSkills,
          missingSkills: analysis.missingSkills,
          summary: analysis.summary,
        });
      } catch (dbError) {
        console.error('Could not save comparison to MongoDB:', dbError.message);
      }
    }

    return res.json({
      success: true,
      savedToMongo: Boolean(savedComparison),
      analysis,
    });
  } catch (error) {
    console.error('Resume analysis failed:', error);
    return res.status(500).json({
      message: error.message || 'Something went wrong during analysis.',
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  if (error.message === 'Only PDF files are allowed.') {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: 'Unexpected server error.' });
});

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  connectDB();
}

startServer();
