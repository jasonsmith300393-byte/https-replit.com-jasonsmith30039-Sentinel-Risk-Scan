const express = require('express');
const cors = require('cors');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=> res.json({ ok:true, message:'AEGIS backend stub' }));

// Stamp image stub - in production use sharp to composite text on image
app.post('/stamp', upload.single('photo'), (req,res)=>{
  // req.file.path -> saved file path
  // req.body contains: timestamp, lat, lon
  res.json({ ok:true, message: 'Stamping is a stub. Replace with Sharp implementation.', file: req.file.filename, data: req.body });
});

// Generate PDF stub
app.post('/generate-pdf', (req,res)=>{
  // req.body should contain the assessment payload
  res.json({ ok:true, message:'PDF generation stub - implement with Puppeteer or pdfkit on server.' });
});

// Send email stub
app.post('/send-email', (req,res)=>{
  // req.body: { to, pdfUrl }
  res.json({ ok:true, message:'Email send stub - implement with nodemailer or SendGrid.' });
});

// Crime stats stub
app.get('/crime', (req,res)=>{
  // Query params: lat, lon, radius_km, sector
  res.json({ ok:true, message:'Crime stats stub - integrate Crimeometer or another provider', data: {} });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log('AEGIS backend stub listening on', PORT));
