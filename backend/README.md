# Backend stub for AEGIS

This folder contains a minimal Express server with stub endpoints for:
- /stamp  -> image stamp (timestamp+coords)
- /generate-pdf -> generate PDF from assessment data
- /send-email -> send PDF by email
- /crime -> crime stats adapter (stub)

Install and run:
cd backend && yarn
yarn start

You will need to install sharp, puppeteer, nodemailer, and set environment variables for production use.
