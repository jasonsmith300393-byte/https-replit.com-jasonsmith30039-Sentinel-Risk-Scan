const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const axios = require('axios');
const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Ensure public directories exist
const PUBLIC_DIR = path.join(__dirname, 'public');
const STAMP_DIR = path.join(PUBLIC_DIR, 'stamped');
const PDF_DIR = path.join(PUBLIC_DIR, 'pdfs');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(STAMP_DIR)) fs.mkdirSync(STAMP_DIR);
if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR);

app.use('/public', express.static(PUBLIC_DIR));

// Multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Configure SendGrid if key exists
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Helper: create SVG overlay with text for bottom-left watermark
function createSvgOverlay(text, width = 800, height = 80) {
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.45)" />
    <text x="10" y="35" font-size="28" fill="#FFFFFF" font-family="sans-serif">${text}</text>
  </svg>
  `;
  return Buffer.from(svg);
}

// Endpoint: stamp an image with timestamp + coords
app.post('/stamp', upload.single('photo'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
    const { timestamp, lat, lon } = req.body;
    const stampText = `${timestamp || new Date().toISOString()} ${lat ? lat.toString() : ''} ${lon ? lon.toString() : ''}`.trim();

    // Read the uploaded file
    const inputPath = file.path;
    const outputFilename = `${uuidv4()}.jpg`;
    const outputPath = path.join(STAMP_DIR, outputFilename);

    // Get metadata to position overlay
    const metadata = await sharp(inputPath).metadata();
    const overlaySvg = createSvgOverlay(stampText, metadata.width || 800, 60);

    // Composite the overlay onto the bottom-left
    await sharp(inputPath)
      .composite([
        { input: overlaySvg, gravity: 'southwest' }
      ])
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove original upload to save space
    try { fs.unlinkSync(inputPath); } catch(e) {}

    const publicUrl = `${BASE_URL}/public/stamped/${outputFilename}`;
    return res.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('Stamp error', err);
    return res.status(500).json({ ok: false, error: 'Stamp failed', detail: err.message });
  }
});

// Endpoint: transcribe audio using AssemblyAI (optional)
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok: false, error: 'No audio uploaded' });
    if (!process.env.ASSEMBLYAI_API_KEY) {
      // Stub: return a fake transcription
      return res.json({ ok: true, transcription: 'Transcription stub - provide ASSEMBLYAI_API_KEY to enable real transcription.' });
    }

    // Upload file to AssemblyAI then request transcription
    const audioData = fs.readFileSync(file.path);
    const uploadResp = await axios.post('https://api.assemblyai.com/v2/upload', audioData, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY, 'content-type': 'application/octet-stream' }
    });
    const uploadUrl = uploadResp.data.upload_url;

    const createResp = await axios.post('https://api.assemblyai.com/v2/transcript', { audio_url: uploadUrl }, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY }
    });
    const transcriptId = createResp.data.id;

    // Poll for completion
    let transcriptText = '';
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const statusResp = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } });
      const status = statusResp.data.status;
      if (status === 'completed') { transcriptText = statusResp.data.text; break; }
      if (status === 'failed') { break; }
    }

    // Cleanup upload
    try { fs.unlinkSync(file.path); } catch(e) {}

    return res.json({ ok: true, transcription: transcriptText || 'Transcription not ready yet' });
  } catch (err) {
    console.error('Transcribe error', err);
    return res.status(500).json({ ok: false, error: 'Transcription failed', detail: err.message });
  }
});

// Endpoint: generate PDF from assessment JSON
app.post('/generate-pdf', async (req, res) => {
  try {
    const assessment = req.body;
    if (!assessment) return res.status(400).json({ ok: false, error: 'Missing assessment payload' });

    // Build a simple HTML template for the PDF
    const html = buildPdfHtml(assessment);

    // Launch puppeteer and render PDF
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const pdfFilename = `${uuidv4()}.pdf`;
    const pdfPath = path.join(PDF_DIR, pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const publicUrl = `${BASE_URL}/public/pdfs/${pdfFilename}`;
    return res.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('Generate PDF error', err);
    return res.status(500).json({ ok: false, error: 'PDF generation failed', detail: err.message });
  }
});

// Endpoint: send email with PDF attachment (SendGrid if configured)
app.post('/send-email', async (req, res) => {
  try {
    const { to, pdfUrl, subject, message } = req.body;
    if (!to || !pdfUrl) return res.status(400).json({ ok: false, error: 'Missing to or pdfUrl' });

    if (process.env.SENDGRID_API_KEY) {
      // Download PDF
      const resp = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const pdfBase64 = Buffer.from(resp.data).toString('base64');
      const from = process.env.DEFAULT_FROM_EMAIL || 'no-reply@aegis.example.com';

      const mail = {
        to,
        from,
        subject: subject || 'AEGIS Assessment PDF',
        text: message || 'Please find attached the AEGIS assessment PDF.',
        attachments: [
          { content: pdfBase64, filename: 'assessment.pdf', type: 'application/pdf', disposition: 'attachment' }
        ]
      };
      await sgMail.send(mail);
      return res.json({ ok: true, message: 'Email sent (SendGrid)' });
    }

    // If SendGrid not configured, return stub
    return res.json({ ok: false, message: 'SendGrid API key not configured. Implement SMTP/SendGrid to enable sending.' });
  } catch (err) {
    console.error('Send email error', err);
    return res.status(500).json({ ok: false, error: 'Email sending failed', detail: err.message });
  }
});

// Endpoint: crime stats (stub / pluggable)
app.get('/crime', async (req, res) => {
  try {
    const { lat, lon, radius_km, sector } = req.query;
    // Currently returns stubbed data. Implement a provider adapter if you have API keys.
    if (!process.env.CRIME_PROVIDER || process.env.CRIME_PROVIDER === 'stub') {
      const stub = {
        provider: 'stub',
        lat, lon, radius_km: radius_km || 15,
        sector: sector || 'unknown',
        summary: `No crime-data provider configured. Provide CRIME_PROVIDER and CRIME_API_KEY to enable live data.`,
        stats: {
          theft: Math.floor(Math.random() * 20),
          burglary: Math.floor(Math.random() * 10),
          assault: Math.floor(Math.random() * 6)
        }
      };
      return res.json({ ok: true, data: stub });
    }

    // Example: implement Crimeometer adapter here if CRIME_PROVIDER is 'crimeometer'
    if (process.env.CRIME_PROVIDER === 'crimeometer' && process.env.CRIME_API_KEY) {
      // Note: Replace endpoint & parameters per Crimeometer docs. This is a placeholder.
      const url = `https://api.crimeometer.com/v1/incidents/raw-data?lat=${lat}&lon=${lon}&distance=${radius_km || 15}`;
      const resp = await axios.get(url, { headers: { 'x-api-key': process.env.CRIME_API_KEY } });
      return res.json({ ok: true, provider: 'crimeometer', data: resp.data });
    }

    return res.status(400).json({ ok:false, error: 'Unsupported CRIME_PROVIDER or missing API key' });
  } catch (err) {
    console.error('Crime error', err);
    return res.status(500).json({ ok: false, error: 'Crime lookup failed', detail: err.message });
  }
});

// Simple health check
app.get('/', (req,res)=> res.json({ ok:true, message:'AEGIS backend running', env: { sendgrid: !!process.env.SENDGRID_API_KEY, assemblyai: !!process.env.ASSEMBLYAI_API_KEY } }));

app.listen(PORT, () => console.log(`AEGIS backend listening on ${PORT}`));

// Helper to build a simple HTML for PDF generation
function buildPdfHtml(assessment) {
  // Safe defaults
  const logoUrl = `${BASE_URL}/public/logo.png`;
  const title = assessment.client?.name || 'AEGIS Assessment';
  const assessmentNumber = assessment.assessmentNumber || '';
  const date = new Date().toLocaleString();

  // Build sections HTML
  const sectionsHtml = (assessment.sections || []).map(s => {
    const photosHtml = (s.items || []).map(it => {
      const img = it.photoUrl || '';
      const comment = it.comment || '';
      const coords = it.coords ? `${it.coords.lat}, ${it.coords.lon}` : '';
      return `<div style="margin-bottom:8px"><img src="${img}" style="max-width:300px;height:auto" /><div style="font-size:12px;color:#333">${comment}</div><div style="font-size:10px;color:#666">${coords}</div></div>`;
    }).join('');
    return `<h3>${s.name}</h3><div>${s.summary || ''}</div>${photosHtml}`;
  }).join('');

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, Helvetica, sans-serif; color:#222;">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1>${title}</h1>
          <div>Assessment #: ${assessmentNumber}</div>
          <div>Date: ${date}</div>
        </div>
        <div><img src="${logoUrl}" style="height:60px;object-fit:contain" /></div>
      </div>

      <hr />
      <h2>Summary</h2>
      <div>${assessment.overview || ''}</div>

      ${sectionsHtml}

      <hr />
      <h2>Overall Score</h2>
      <div style="font-size:20px;font-weight:bold">${assessment.overallScore || 'N/A'} / 100</div>

      <hr />
      <h2>Recommendations</h2>
      <div>${assessment.recommendations?.auto || ''}</div>
    </body>
  </html>
  `;
  return html;
}
