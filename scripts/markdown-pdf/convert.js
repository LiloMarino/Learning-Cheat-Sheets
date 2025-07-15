#!/usr/bin/env node

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
  executablePath: ''
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
});

(async () => {
  if (!fs.existsSync(inputPath)) {
    console.error('Arquivo não encontrado:', inputPath);
    process.exit(1);
  }

  await markdownPdfStandalone(inputPath, type, options);
})();
