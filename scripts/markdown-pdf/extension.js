'use strict';
var path = require('path');
var fs = require('fs');
var url = require('url');
var os = require('os');
const mustache = require('mustache');
const grayMatter = require('gray-matter');
const highlight = require('highlight.js');
const cheerio = require('cheerio');
const markdownIt = require('markdown-it');
const puppeteer = require('puppeteer-core');



export async function markdownPdfStandalone(inputPath, option_type = 'pdf') {
  try {
    const types_format = ['html', 'pdf', 'png', 'jpeg'];
    let types = [];

    if (types_format.includes(option_type)) {
      types = [option_type];
    } else if (option_type === 'all') {
      types = types_format;
    } else {
      console.error('Supported formats: html, pdf, png, jpeg.');
      return;
    }

    const ext = path.extname(inputPath);
    const text = fs.readFileSync(inputPath, 'utf-8');
    const uri = { fsPath: inputPath }; // mock para compatibilidade de chamada

    for (const type of types) {
      const filename = inputPath.replace(ext, '.' + type);
      const content = convertMarkdownToHtml(inputPath, type, markdownString, {
        breaks: true,
        emoji: true,
        enablePlantUML: true,
        plantumlServer: 'https://www.plantuml.com/plantuml',
        enableInclude: true
      });
      const html = makeHtml(content, uri);
      await exportPdf(html, filename, type, uri); // você vai adaptar exportPdf depois
      console.log(`Exported to ${filename}`);
    }

  } catch (error) {
    console.error('markdownPdfStandalone() error:', error);
  }
}



/*
 * convert markdown to html (markdown-it)
 */
function convertMarkdownToHtml(filename, type, text, options = {}) {
  try {
    const matterParts = grayMatter(text);

    const breaks = setBooleanValue(
      matterParts.data.breaks,
      options.breaks ?? false
    );

    const md = markdownIt({
      html: true,
      breaks: breaks,
      highlight: function (str, lang) {
        if (lang && lang.match(/\bmermaid\b/i)) {
          return `<div class="mermaid">${str}</div>`;
        }

        if (lang && highlight.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code><div>${highlight.highlight(lang, str, true).value}</div></code></pre>`;
          } catch (err) {
            return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
          }
        }
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    });

    // imagem
    const defaultRender = md.renderer.rules.image;
    md.renderer.rules.image = function (tokens, idx, opts, env, self) {
      let token = tokens[idx];
      let href = token.attrs[token.attrIndex('src')][1];
      href = type === 'html'
        ? decodeURIComponent(href).replace(/("|')/g, '')
        : convertImgPath(href, filename);
      token.attrs[token.attrIndex('src')][1] = href;
      return defaultRender(tokens, idx, opts, env, self);
    };

    if (type !== 'html') {
      md.renderer.rules.html_block = function (tokens, idx) {
        const $ = cheerio.load(tokens[idx].content);
        $('img').each(function () {
          const src = $(this).attr('src');
          $(this).attr('src', convertImgPath(src, filename));
        });
        return $.html();
      };
    }

    // checkbox
    md.use(require('markdown-it-checkbox'));

    // emoji
    const enableEmoji = setBooleanValue(
      matterParts.data.emoji,
      options.emoji ?? false
    );
    if (enableEmoji) {
      const emojiDefs = require(path.join(__dirname, 'data', 'emoji.json'));
      md.use(require('markdown-it-emoji'), { defs: emojiDefs });
      md.renderer.rules.emoji = function (token, idx) {
        const emoji = token[idx].markup;
        const emojiPath = path.join(__dirname, 'node_modules', 'emoji-images', 'pngs', emoji + '.png');
        if (!fs.existsSync(emojiPath)) return ':' + emoji + ':';
        const base64 = fs.readFileSync(emojiPath).toString('base64');
        return `<img class="emoji" alt="${emoji}" src="data:image/png;base64,${base64}" />`;
      };
    }

    // named headers
    md.use(require('markdown-it-named-headers'), { slugify: Slug });

    // container
    md.use(require('markdown-it-container'), '', {
      validate: name => name.trim().length,
      render: (tokens, idx) => {
        return tokens[idx].info.trim()
          ? `<div class="${tokens[idx].info.trim()}">\n`
          : `</div>\n`;
      }
    });

    // PlantUML
    if (options.enablePlantUML) {
      md.use(require('markdown-it-plantuml'), {
        openMarker: matterParts.data.plantumlOpenMarker || options.plantumlOpenMarker || '@startuml',
        closeMarker: matterParts.data.plantumlCloseMarker || options.plantumlCloseMarker || '@enduml',
        server: options.plantumlServer || ''
      });
    }

    // include files
    if (options.enableInclude) {
      md.use(require('markdown-it-include'), {
        root: path.dirname(filename),
        includeRe: /:\[.+\]\((.+\..+)\)/i
      });
    }

    return md.render(matterParts.content);
  } catch (error) {
    console.error('convertMarkdownToHtml()', error);
    return '';
  }
}

/*
 * https://github.com/microsoft/vscode/blob/ca4ceeb87d4ff935c52a7af0671ed9779657e7bd/extensions/markdown-language-features/src/slugify.ts#L26
 */
function Slug(string) {
  try {
    var stg = encodeURI(
      string.trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace whitespace with -
            .replace(/[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g, '') // Remove known punctuators
            .replace(/^\-+/, '') // Remove leading -
            .replace(/\-+$/, '') // Remove trailing -
    );
    return stg;
  } catch (error) {
    showErrorMessage('Slug()', error);
  }
}

/**
 * Gera HTML a partir do conteúdo convertido de Markdown
 * @param {string} data - HTML do corpo (conteúdo convertido)
 * @param {string} filename - Caminho do arquivo markdown original
 * @param {object} options - Configurações adicionais
 * @returns {string} HTML final com estilo, título e script Mermaid
 */
function makeHtml(data, filename, options = {}) {
  try {
    // lê os estilos
    let style = '';
    style += readStyles(filename, options.stylesheetPaths);

    // título = nome do arquivo sem extensão
    const title = path.basename(filename);

    // carrega template HTML
    const templatePath = path.join(__dirname, 'template', 'template.html');
    const template = readFile(templatePath);

    // script do Mermaid (se houver)
    const mermaidServer = options.mermaidServer || '';
    const mermaid = mermaidServer
      ? `<script src="${mermaidServer}"></script>`
      : '';

    // preenche template com Mustache
    const view = {
      title: title,
      style: style,
      content: data,
      mermaid: mermaid
    };

    return mustache.render(template, view);
  } catch (error) {
    console.error('makeHtml()', error);
    return '';
  }
}

/*
 * export a html to a html file
 */
function exportHtml(data, filename) {
  fs.writeFile(filename, data, 'utf-8', function (error) {
    if (error) {
      showErrorMessage('exportHtml()', error);
      return;
    }
  });
}

/*
 * export a html to a pdf file (html-pdf)
 */
async function exportPdf(data, filename, type, options = {}) {
  try {
    // Verifica se o executável do Chrome/Chromium foi informado ou usa o padrão do puppeteer
    const executablePath = options.executablePath || puppeteer.executablePath();

    if (!fs.existsSync(executablePath)) {
      console.error('Chromium or Chrome executable not found! Configure "executablePath" option.');
      return;
    }

    // Gera arquivo temporário HTML
    const tmpFilename = path.join(path.dirname(filename), path.parse(filename).name + '_tmp.html');
    fs.writeFileSync(tmpFilename, data, 'utf-8');

    // Configura args padrão para Linux Sandbox, pode ser customizado
    const launchOptions = {
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    // Inicializa browser Puppeteer
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setDefaultTimeout(0);

    // Navega para o arquivo HTML temporário
    await page.goto('file://' + tmpFilename, { waitUntil: 'networkidle0' });

    if (type === 'html') {
      // Apenas salva o HTML final no destino
      fs.writeFileSync(filename, data, 'utf-8');
      console.log(`Exported HTML to ${filename}`);
    }

    if (type === 'pdf') {
      // Configura opções PDF com valores padrão ou opções passadas
      const pdfOptions = {
        path: filename,
        scale: options.scale || 1,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate ? transformTemplate(options.headerTemplate) : '',
        footerTemplate: options.footerTemplate ? transformTemplate(options.footerTemplate) : '',
        printBackground: options.printBackground !== undefined ? options.printBackground : true,
        landscape: options.orientation === 'landscape',
        pageRanges: options.pageRanges || '',
        format: (!options.width && !options.height) ? (options.format || 'A4') : undefined,
        width: options.width || undefined,
        height: options.height || undefined,
        margin: {
          top: options.margin?.top || '0',
          right: options.margin?.right || '0',
          bottom: options.margin?.bottom || '0',
          left: options.margin?.left || '0'
        },
        timeout: 0,
      };
      await page.pdf(pdfOptions);
      console.log(`Exported PDF to ${filename}`);
    }

    if (type === 'png' || type === 'jpeg') {
      // Configura opções de screenshot
      const screenshotOptions = {
        path: filename,
        quality: type === 'jpeg' ? (options.quality || 100) : undefined,
        fullPage: true,
        omitBackground: options.omitBackground || false,
        type: type,
      };

      // Se definir clip, usa clip e desativa fullPage
      if (
        options.clip &&
        options.clip.x !== undefined &&
        options.clip.y !== undefined &&
        options.clip.width !== undefined &&
        options.clip.height !== undefined
      ) {
        screenshotOptions.clip = {
          x: options.clip.x,
          y: options.clip.y,
          width: options.clip.width,
          height: options.clip.height,
        };
        screenshotOptions.fullPage = false;
      }

      await page.screenshot(screenshotOptions);
      console.log(`Exported ${type.toUpperCase()} to ${filename}`);
    }

    await browser.close();

    // Remove arquivo temporário, a menos que debug esteja ativo
    if (!options.debug) {
      if (fs.existsSync(tmpFilename)) {
        fs.unlinkSync(tmpFilename);
      }
    }
  } catch (error) {
    console.error('exportPdf() error:', error);
  }
}

/**
 * Transform the text of the header or footer template, replacing the following supported placeholders:
 *
 * - `%%ISO-DATETIME%%` – For an ISO-based date and time format: `YYYY-MM-DD hh:mm:ss`
 * - `%%ISO-DATE%%` – For an ISO-based date format: `YYYY-MM-DD`
 * - `%%ISO-TIME%%` – For an ISO-based time format: `hh:mm:ss`
 */
function transformTemplate(templateText) {
  if (templateText.indexOf('%%ISO-DATETIME%%') !== -1) {
    templateText = templateText.replace('%%ISO-DATETIME%%', new Date().toISOString().substr(0, 19).replace('T', ' '));
  }
  if (templateText.indexOf('%%ISO-DATE%%') !== -1) {
    templateText = templateText.replace('%%ISO-DATE%%', new Date().toISOString().substr(0, 10));
  }
  if (templateText.indexOf('%%ISO-TIME%%') !== -1) {
    templateText = templateText.replace('%%ISO-TIME%%', new Date().toISOString().substr(11, 8));
  }

  return templateText;
}

function isExistsPath(path) {
  if (path.length === 0) {
    return false;
  }
  try {
    fs.accessSync(path);
    return true;
  } catch (error) {
    console.warn(error.message);
    return false;
  }
}

function isExistsDir(dirname) {
  if (dirname.length === 0) {
    return false;
  }
  try {
    if (fs.statSync(dirname).isDirectory()) {
      return true;
    } else {
      console.warn('Directory does not exist!') ;
      return false;
    }
  } catch (error) {
    console.warn(error.message);
    return false;
  }
}

function readFile(filename, encode) {
  if (filename.length === 0) {
    return '';
  }
  if (!encode && encode !== null) {
    encode = 'utf-8';
  }
  if (filename.indexOf('file://') === 0) {
    if (process.platform === 'win32') {
      filename = filename.replace(/^file:\/\/\//, '')
                 .replace(/^file:\/\//, '');
    } else {
      filename = filename.replace(/^file:\/\//, '');
    }
  }
  if (isExistsPath(filename)) {
    return fs.readFileSync(filename, encode);
  } else {
    return '';
  }
}

function convertImgPath(src, filename) {
  try {
    var href = decodeURIComponent(src);
    href = href.replace(/("|')/g, '')
          .replace(/\\/g, '/')
          .replace(/#/g, '%23');
    var protocol = url.parse(href).protocol;
    if (protocol === 'file:' && href.indexOf('file:///') !==0) {
      return href.replace(/^file:\/\//, 'file:///');
    } else if (protocol === 'file:') {
      return href;
    } else if (!protocol || path.isAbsolute(href)) {
      href = path.resolve(path.dirname(filename), href).replace(/\\/g, '/')
                                                      .replace(/#/g, '%23');
      if (href.indexOf('//') === 0) {
        return 'file:' + href;
      } else if (href.indexOf('/') === 0) {
        return 'file://' + href;
      } else {
        return 'file:///' + href;
      }
    } else {
      return src;
    }
  } catch (error) {
    showErrorMessage('convertImgPath()', error);
  }
}

function makeCss(filename) {
  try {
    var css = readFile(filename);
    if (css) {
      return '\n<style>\n' + css + '\n</style>\n';
    } else {
      return '';
    }
  } catch (error) {
    showErrorMessage('makeCss()', error);
  }
}

/**
 * Lê e concatena estilos CSS para o HTML final
 * @param {string} basePath - Caminho base para resolver estilos relativos
 * @param {object} config - Configurações equivalentes às do vscode.workspace.getConfiguration
 * @returns {string} HTML contendo <style> e <link> para estilos
 */
function readStyles(basePath, config = {}) {
  try {
    let style = '';

    const includeDefaultStyles = config.includeDefaultStyles || false;

    // 1. estilo markdown padrão
    if (includeDefaultStyles) {
      const filename = path.join(__dirname, 'styles', 'markdown.css');
      style += makeCss(filename);
    }

    // 2. estilos adicionais do markdown.styles (array de URLs/paths)
    if (includeDefaultStyles) {
      const styles = config.markdownStyles || [];
      if (Array.isArray(styles) && styles.length > 0) {
        for (const hrefStyle of styles) {
          const href = fixHref(basePath, hrefStyle);
          style += `<link rel="stylesheet" href="${href}" type="text/css">`;
        }
      }
    }

    // 3. estilo do highlight.js
    const highlightEnabled = config.highlight || false;
    const highlightStyle = config.highlightStyle || '';
    if (highlightEnabled) {
      let filename;
      if (highlightStyle) {
        filename = path.join(__dirname, 'node_modules', 'highlight.js', 'styles', highlightStyle);
      } else {
        filename = path.join(__dirname, 'styles', 'tomorrow.css');
      }
      style += makeCss(filename);
    }

    // 4. estilo markdown-pdf padrão
    if (includeDefaultStyles) {
      const filename = path.join(__dirname, 'styles', 'markdown-pdf.css');
      style += makeCss(filename);
    }

    // 5. estilos adicionais do markdown-pdf.styles (array)
    const mdPdfStyles = config.markdownPdfStyles || [];
    if (Array.isArray(mdPdfStyles) && mdPdfStyles.length > 0) {
      for (const hrefStyle of mdPdfStyles) {
        const href = fixHref(basePath, hrefStyle);
        style += `<link rel="stylesheet" href="${href}" type="text/css">`;
      }
    }

    return style;

  } catch (error) {
    console.error('readStyles() error:', error);
    return '';
  }
}

/**
 * Resolve href para uma URI adequada (file:// ou URL http/https)
 * @param {string} basePath - caminho base para resolver paths relativos (ex: arquivo markdown)
 * @param {string} href - href a ser resolvido (pode ser URL, path absoluto ou relativo)
 * @returns {string} href absoluto como URL (file:// ou http://)
 */
function fixHref(basePath, href) {
  try {
    if (!href) {
      return href;
    }

    // Detecta se é URL http ou https
    const parsedUrl = url.parse(href);
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return href;
    }

    // Expande ~ para home do usuário
    if (href.startsWith('~')) {
      return 'file://' + path.join(os.homedir(), href.slice(1));
    }

    // Path absoluto (começa com / no unix ou com letra:\ no windows)
    if (path.isAbsolute(href)) {
      // Normaliza para file:// URI
      return 'file://' + href.replace(/\\/g, '/');
    }

    // Path relativo — resolve em relação ao basePath (ex: diretório do arquivo markdown)
    return 'file://' + path.resolve(basePath, href).replace(/\\/g, '/');

  } catch (error) {
    console.error('fixHref() error:', error);
    return href;
  }
}

function showErrorMessage(msg, error) {
  console.error('ERROR: ' + msg);
  if (error) {
    console.error(error);
  }
}

function setBooleanValue(a, b) {
  return a === false ? false : a || b;
}