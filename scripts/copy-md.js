const fs = require('fs');
const path = require('path');

function stripFrontmatter(content) {
  const match = content.match(/^---\s*[\s\S]*?\s*---\s*/);
  return match ? content.slice(match[0].length) : content;
}

function processMarkdownFiles(srcDir, outDir) {
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const stripped = stripFrontmatter(content);
    fs.writeFileSync(path.join(outDir, file), stripped);
  }
}

processMarkdownFiles('cheatsheets', 'assets/markdown');
