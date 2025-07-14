// scripts/convert-wrapper.js
const fs = require('fs');
const path = require('path');
const convertMarkdownToHtml = require('../tools/markdown-pdf-ext/my-convert-html');
const puppeteer = require('puppeteer');

async function gerarPDF(mdPath) {
  const markdown = fs.readFileSync(mdPath, 'utf8');
  const html = convertMarkdownToHtml(mdPath, 'pdf', markdown);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const output = mdPath.replace(/\.md$/, '.pdf');
  await page.pdf({ path: output, format: 'A4' });

  await browser.close();
  console.log(`PDF gerado: ${output}`);
}

gerarPDF(process.argv[2]);
