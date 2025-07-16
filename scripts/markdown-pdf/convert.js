const path = require('path');
const fs = require('fs');
const { markdownPdfStandalone } = require('./extension');

// Parser básico de argumentos
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log(`
Usage: node convert.js <input.md> [type] [options]

Arguments:
  <input.md>        Caminho para o arquivo Markdown
  [type]            Tipo de saída (pdf, html, png, jpeg, all). Default: pdf

Options (via flags):
  --emoji           Ativa suporte a emojis
  --breaks          Ativa quebra de linha como <br>
  --plantuml        Ativa suporte ao PlantUML
  --outdir=DIR      Diretório de saída
  --css=FILE        Caminho do CSS personalizado
  --chrome=PATH     Caminho do executável do Chrome/Chromium
  --header               Ativa displayHeaderFooter
  --headerTemplate=HTML  Template do header
  --footerTemplate=HTML  Template do footer
  --format=A4|Letter     Tamanho da página (default: A4)
  --orientation=portrait|landscape  Orientação da página
  --margin=top:1cm,...   Margens personalizadas

`);
  process.exit(0);
}

const inputPath = path.resolve(args[0]);
const type = args[1] || 'pdf';

const options = {
  emoji: args.includes('--emoji'),
  breaks: args.includes('--breaks'),
  enablePlantUML: args.includes('--plantuml'),
  enableInclude: true, // sempre ligado
  outputDirectory: '',  // default atual, pode ser substituído abaixo
  stylesheetPaths: [],
  executablePath: '',
  highlight: true,
  highlightStyle: 'tomorrow.css'
};

// Parse de opções com valores
args.forEach(arg => {
  if (arg.startsWith('--outdir=')) {
    options.outputDirectory = arg.split('=')[1];
  }
  if (arg.startsWith('--css=')) {
    options.stylesheetPaths.push(arg.split('=')[1]);
  }
  if (arg.startsWith('--chrome=')) {
    options.executablePath = arg.split('=')[1];
  }
  if (arg === '--header') {
    options.displayHeaderFooter = true;
  }
  if (arg.startsWith('--headerTemplate=')) {
    options.headerTemplate = arg.split('=')[1];
  }
  if (arg.startsWith('--footerTemplate=')) {
    options.footerTemplate = arg.split('=')[1];
  }
  if (arg.startsWith('--format=')) {
    options.format = arg.split('=')[1];
  }
  if (arg.startsWith('--orientation=')) {
    options.orientation = arg.split('=')[1];
  }
  if (arg.startsWith('--margin=')) {
    // exemplo: --margin=top:1.5cm,right:1cm,bottom:1cm,left:1cm
    const parts = arg.split('=')[1].split(',');
    options.margin = {};
    for (const part of parts) {
      const [k, v] = part.split(':');
      options.margin[k.trim()] = v.trim();
    }
  }

});

(async () => {
  if (!fs.existsSync(inputPath)) {
    console.error('Arquivo não encontrado:', inputPath);
    process.exit(1);
  }

  await markdownPdfStandalone(inputPath, type, options);
})();
