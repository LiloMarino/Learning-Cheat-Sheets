const path = process.argv[2];
const { execFileSync } = require('child_process');

if (!path) {
  console.error("Por favor, passe o caminho do arquivo como argumento!");
  process.exit(1);
}

// PDF
execFileSync("node", [
  "scripts/markdown-pdf/convert.js",
  path,
  "pdf",
  "--css=scripts/markdown-pdf/custom.css",
  "--outdir=assets/pdfs"
], { stdio: "inherit" });

// HTML
execFileSync("node", [
  "scripts/markdown-pdf/convert.js",
  path,
  "html",
  "--css=scripts/markdown-pdf/custom.css",
  "--outdir=assets/html"
], { stdio: "inherit" });
