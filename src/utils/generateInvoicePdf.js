const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

async function generateInvoicePdf(htmlFilePath, outputFileName) {
  const browser = await puppeteer.launch({
    headless: 'new', // or true depending on puppeteer version
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Read your HTML template from file
  const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Ensure invoices folder exists
  const outputDir = path.join(__dirname, '../invoices');
  await fs.ensureDir(outputDir);

  const pdfPath = path.join(outputDir, outputFileName);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  return pdfPath;
}

module.exports = generateInvoicePdf;
