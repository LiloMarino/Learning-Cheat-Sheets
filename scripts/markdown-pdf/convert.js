const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');
const mustache = require('mustache');
const puppeteer = require('puppeteer');

const md = markdownIt({ html: true });

// Caminhos fixos
const cheatsheetDir = path.resolve(__dirname, '../../cheatsheets');
const outputDir = path.resolve(__dirname, '../../cheatsheets/output');
const templatePath = path.resolve(__dirname, 'template/template.html');

// Garante que a pasta de saída exista
fs.mkdirSync(outputDir, { recursive: true });

// Carrega template base
const templateHtml = fs.readFileSync(templatePath, 'utf8');

// Função principal de conversão
async function convertAll() {
  const files = fs.readdirSync(cheatsheetDir).filter(file => file.endsWith('.md'));

  for (const file of files) {
    const mdPath = path.join(cheatsheetDir, file);
    const baseName = path.basename(file, '.md');
    const outputHtmlPath = path.join(outputDir, baseName + '.html');
    const outputPdfPath = path.join(outputDir, baseName + '.pdf');

    const markdownContent = fs.readFileSync(mdPath, 'utf8');
    const htmlContent = md.render(markdownContent);

    const finalHtml = mustache.render(templateHtml, {
      title: baseName,
      content: htmlContent,
      style: '', // insira CSS inline aqui se quiser
      mermaid: '', // ou insira o script do mermaid aqui se necessário
    });

    fs.writeFileSync(outputHtmlPath, finalHtml, 'utf8');
    console.log(`✅ HTML gerado: ${outputHtmlPath}`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outputPdfPath, format: 'A4', printBackground: true });
    await browser.close();

    console.log(`📄 PDF gerado: ${outputPdfPath}`);
  }
}

convertAll().catch(console.error);
