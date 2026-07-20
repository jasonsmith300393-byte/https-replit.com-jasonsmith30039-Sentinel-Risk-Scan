AEGIS backend - implementation notes

Endpoints implemented:
- POST /stamp (multipart/form-data: photo file, fields: timestamp, lat, lon) -> returns { ok: true, url }
  - Uses sharp to composite a semi-transparent SVG with timestamp+coords on the bottom-left.
- POST /transcribe (multipart/form-data: audio file) -> attempts to use AssemblyAI if ASSEMBLYAI_API_KEY is set; otherwise returns a stub transcription.
- POST /generate-pdf (application/json: assessment payload) -> returns { ok: true, url } where url is a public URL to the generated PDF.
  - Uses Puppeteer to render a basic HTML template and saves the PDF under backend/public/pdfs.
- POST /send-email (application/json: { to, pdfUrl, subject, message }) -> sends email with PDF attached using SendGrid if SENDGRID_API_KEY is set; otherwise returns a stub response.
- GET /crime?lat=&lon=&radius_km=&sector= -> returns stub data unless CRIME_PROVIDER and CRIME_API_KEY are configured.

Configuration
- Copy backend/.env.example to backend/.env and add keys for SENDGRID_API_KEY, ASSEMBLYAI_API_KEY, CRIME_API_KEY, CRIME_PROVIDER (e.g., 'crimeometer').
- BASE_URL should be set to the public URL where your backend will be reachable (used for embedding images in PDFs).

Security & production notes
- The current scaffold stores files locally under backend/public. For production use, consider using S3 or Google Cloud Storage and a CDN.
- Puppeteer may require additional configuration on some hosting providers (e.g., setting up the chromium binary). On services like Render, Railway, or Heroku, add appropriate buildpacks and dependencies.
- Validate and sanitize all uploaded files before processing in production.
