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
const puppeteer = require('puppeteer');

/**
 * Converte arquivo Markdown em arquivo(s) nos formatos HTML, PDF, PNG ou JPEG
 * @param {string} inputPath - Caminho do arquivo Markdown
 * @param {string} [option_type='pdf'] - Tipo de saída: 'html', 'pdf', 'png', 'jpeg' ou 'all'
 * @param {object} [options={}] - Opções para controle de plugins e features
 */
async function markdownPdfStandalone(inputPath, option_type = 'pdf', options = {}) {
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
    const markdownString = fs.readFileSync(inputPath, 'utf-8');

    if (options.outputDirectory && !fs.existsSync(options.outputDirectory)) {
      fs.mkdirSync(options.outputDirectory, { recursive: true });
    }

    for (const type of types) {
      const basename = path.basename(inputPath, ext);
      const outdir = options.outputDirectory || path.dirname(inputPath);
      const filename = path.join(outdir, basename + '.' + type);
      const content = convertMarkdownToHtml(inputPath, type, markdownString, {
        breaks: true,
        emoji: true,
        enablePlantUML: true,
        plantumlServer: 'https://www.plantuml.com/plantuml',
        enableInclude: true
      });
      const html = makeHtml(content, inputPath, options);
      await exportPdf(html, filename, type, options);
      console.log(`Exported to ${filename}`);
    }
  } catch (error) {
    console.error('markdownPdfStandalone() error:', error);
  }
}

/**
 * Converte texto Markdown para HTML usando markdown-it e plugins
 * @param {string} filename - Caminho do arquivo markdown (para resolver imagens e includes)
 * @param {string} type - Tipo de saída ('html', 'pdf', etc), para tratar paths de imagem
 * @param {string} text - Conteúdo markdown bruto
 * @param {object} [options={}] - Opções para controle de plugins e features
 * @returns {string} HTML convertido
 */
function convertMarkdownToHtml(filename, type, text, options = {}) {
  try {
    const matterParts = grayMatter(text);

    const breaks = setBooleanValue(matterParts.data.breaks, options.breaks ?? false);

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
          } catch {
            return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
          }
        }
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    });

    // Corrige caminho das imagens
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

    // Plugins
    md.use(require('markdown-it-checkbox'));

    const enableEmoji = setBooleanValue(matterParts.data.emoji, options.emoji ?? false);
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

    md.use(require('markdown-it-named-headers'), { slugify: Slug });

    md.use(require('markdown-it-container'), '', {
      validate: name => name.trim().length,
      render: (tokens, idx) => {
        return tokens[idx].info.trim()
          ? `<div class="${tokens[idx].info.trim()}">\n`
          : `</div>\n`;
      }
    });

    if (options.enablePlantUML) {
      md.use(require('markdown-it-plantuml'), {
        openMarker: matterParts.data.plantumlOpenMarker || options.plantumlOpenMarker || '@startuml',
        closeMarker: matterParts.data.plantumlCloseMarker || options.plantumlCloseMarker || '@enduml',
        server: options.plantumlServer || ''
      });
    }

    if (options.enableInclude) {
      md.use(require('markdown-it-include'), {
        root: path.dirname(filename),
        includeRe: /:\[.+\]\((.+\..+)\)/i
      });
    }

    return md.render(matterParts.content);

  } catch (error) {
    console.error('convertMarkdownToHtml() error:', error);
    return '';
  }
}

/**
 * Função para slugify de títulos (headers) usados em ancoras
 * @param {string} string - Texto a ser convertido em slug
 * @returns {string} Slug URI-safe
 */
function Slug(string) {
  try {
    return encodeURI(
      string.trim()
        .toLowerCase()
        .replace(/\s+/g, '-') // espaços viram -
        .replace(/[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g, '') // remove pontuação
        .replace(/^\-+/, '') // remove - iniciais
        .replace(/\-+$/, '') // remove - finais
    );
  } catch (error) {
    showErrorMessage('Slug()', error);
  }
}

/**
 * Gera HTML final com estilo e template a partir do corpo em HTML
 * @param {string} data - HTML convertido do markdown
 * @param {string} filename - Caminho do arquivo markdown original
 * @param {object} [options={}] - Configurações adicionais para estilos, Mermaid, etc
 * @returns {string} HTML completo para exportação
 */
function makeHtml(data, filename, options = {}) {
  try {
    let style = '';
    style += readStyles(filename, {
      includeDefaultStyles: true,
      stylesheetPaths: options.stylesheetPaths,
      highlight: options.highlight || false,
      highlightStyle: options.highlightStyle || ''
    });


    const title = path.basename(filename);

    const templatePath = path.join(__dirname, 'template', 'template.html');
    const template = readFile(templatePath);

    const mermaidServer = options.mermaidServer || '';
    const mermaid = mermaidServer
      ? `<script src="${mermaidServer}"></script>`
      : '';

    const view = {
      title,
      style,
      content: data,
      mermaid
    };

    return mustache.render(template, view);

  } catch (error) {
    console.error('makeHtml() error:', error);
    return '';
  }
}

/**
 * Exporta conteúdo HTML para arquivo
 * @param {string} data - Conteúdo HTML
 * @param {string} filename - Caminho do arquivo de saída
 */
function exportHtml(data, filename) {
  fs.writeFile(filename, data, 'utf-8', function (error) {
    if (error) {
      showErrorMessage('exportHtml()', error);
      return;
    }
  });
}

/**
 * Exporta HTML para PDF, PNG, JPEG ou HTML usando Puppeteer
 * @param {string} data - HTML a ser exportado
 * @param {string} filename - Caminho do arquivo de saída
 * @param {string} type - Tipo do arquivo: 'html', 'pdf', 'png', 'jpeg'
 * @param {object} [options={}] - Opções adicionais para puppeteer e exportação
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
    await page.goto('file://' + path.resolve(tmpFilename).replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

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
          top: options.margin?.top || '1.5cm',
          right: options.margin?.right || '1cm',
          bottom: options.margin?.bottom || '1cm',
          left: options.margin?.left || '1cm'
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
 * Substitui placeholders de data e hora no template do header/footer
 * @param {string} templateText - Template contendo placeholders
 * @returns {string} Template com placeholders substituídos
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

/**
 * Verifica se o caminho existe no sistema de arquivos
 * @param {string} path - Caminho a ser verificado
 * @returns {boolean} true se o caminho existe, false caso contrário
 */
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

/**
 * Verifica se o diretório existe no sistema de arquivos
 * @param {string} dirname - Diretório a ser verificado
 * @returns {boolean} true se for diretório e existir, false caso contrário
 */
function isExistsDir(dirname) {
  if (dirname.length === 0) {
    return false;
  }
  try {
    if (fs.statSync(dirname).isDirectory()) {
      return true;
    } else {
      console.warn('Directory does not exist!');
      return false;
    }
  } catch (error) {
    console.warn(error.message);
    return false;
  }
}

/**
 * Lê arquivo texto de forma síncrona
 * @param {string} filename - Caminho do arquivo
 * @param {string} [encode='utf-8'] - Codificação do arquivo
 * @returns {string} Conteúdo do arquivo ou string vazia se não existir
 */
function readFile(filename, encode = 'utf-8') {
  if (filename.length === 0) {
    return '';
  }
  if (filename.indexOf('file://') === 0) {
    if (process.platform === 'win32') {
      filename = filename.replace(/^file:\/\/\//, '').replace(/^file:\/\//, '');
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

/**
 * Converte caminho da imagem para URL adequada
 * @param {string} src - Caminho original da imagem
 * @param {string} filename - Caminho do arquivo markdown para resolver relativo
 * @returns {string} Caminho convertido para uso na página HTML
 */
function convertImgPath(src, filename) {
  try {
    var href = decodeURIComponent(src);
    href = href.replace(/("|')/g, '').replace(/\\/g, '/').replace(/#/g, '%23');
    var protocol = url.parse(href).protocol;
    if (protocol === 'file:' && href.indexOf('file:///') !== 0) {
      return href.replace(/^file:\/\//, 'file:///');
    } else if (protocol === 'file:') {
      return href;
    } else if (!protocol || path.isAbsolute(href)) {
      href = path.resolve(path.dirname(filename), href).replace(/\\/g, '/').replace(/#/g, '%23');
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

/**
 * Lê conteúdo CSS e o envolve em tag <style>
 * @param {string} filename - Caminho do arquivo CSS
 * @returns {string} CSS formatado para inclusão no HTML ou string vazia
 */
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
 * @param {object} config - Configurações com propriedades:
 *  - includeDefaultStyles {boolean}
 *  - markdownStyles {array<string>}
 *  - highlight {boolean}
 *  - highlightStyle {string}
 *  - markdownPdfStyles {array<string>}
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
        const nodeStylePath = path.join(__dirname, 'node_modules', 'highlight.js', 'styles', highlightStyle);
        const localStylePath = path.join(__dirname, 'styles', highlightStyle);
        filename = fs.existsSync(nodeStylePath) ? nodeStylePath : localStylePath;
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
 * @param {string} basePath - caminho base para resolver paths relativos (ex: diretório do arquivo markdown)
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

/**
 * Exibe mensagem de erro padronizada
 * @param {string} msg - Mensagem de contexto
 * @param {Error} error - Objeto Error
 */
function showErrorMessage(msg, error) {
  console.error('ERROR: ' + msg);
  if (error) {
    console.error(error);
  }
}

/**
 * Define valor booleano considerando valor prioritário
 * @param {any} a - Valor primário (normalmente do front matter)
 * @param {any} b - Valor secundário (opcional, default)
 * @returns {boolean} Valor booleano resultante
 */
function setBooleanValue(a, b) {
  return a === false ? false : Boolean(a || b);
}

module.exports = { markdownPdfStandalone };