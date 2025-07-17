# 📝 Cheatsheet Generator com GitHub Pages

Este projeto permite transformar arquivos Markdown em três formatos acessíveis:
- 📄 PDF
- 🌐 HTML
- ✍️ O próprio Markdown

Tudo isso organizado em um site responsivo hospedado no GitHub Pages.

## 🚀 Funcionalidades

- Conversão automática de `.md` para `.pdf` e `.html` (Obrigado ao yzane pelo conversor)
- Navegação amigável com busca integrada
- Ideal para consulta rápida, estudo e documentação técnica
- Totalmente estático e hospedado gratuitamente via GitHub Pages

## 🌍 Acesse o site

> Um site com vários cheatsheets para aprender o mais rápido possível e para uso de referência.

[👉 Veja o site no GitHub Pages](https://lilomarino.github.io/Learning-Cheat-Sheets/)


## 🤝 Como Usar

### 🧪 Requisitos

- Node.js (v18+)
- Ruby com bundler (para rodar o Jekyll localmente, se desejar)
- GitHub Pages (ativado no repositório)

### 🛠️ Passo a passo

1. **Fork este repositório**  
   Crie sua própria cópia clicando em "Fork" no topo da página.

2. **Adicione suas cheatsheets em `cheatsheets/`**  
   Use arquivos `.md` com front-matter YAML no início:
   ```markdown
   ---
   title: Python Básico
   description: Comandos essenciais e estruturas básicas da linguagem.
   ---

   # Python Básico

   ## Variáveis
   ```

3. **Gere os arquivos**
   No terminal:

   ```bash
    npm install
    mkdir -p assets/html assets/pdfs assets/markdown
    node scripts/copy-md.js
    for file in cheatsheets/*.md; do
    node scripts/markdown-pdf/convert.js "$file" pdf --outdir=assets/pdfs
    node scripts/markdown-pdf/convert.js "$file" html --outdir=assets/html
    done
   ```

   Isso irá:

   * Copiar os `.md` sem front-matter para `assets/markdown/`
   * Gerar `.pdf` e `.html` em `assets/pdfs/` e `assets/html/`

4. **Suba para o GitHub e ative o GitHub Pages**
   Vá em **Settings → Pages** e selecione a branch `main` (ou `gh-pages` se você preferir separar).

---

## 📦 Para Clonar e Usar Localmente

```bash
git clone https://github.com/LiloMarino/Learning-Cheat-Sheets.git
cd Learning-Cheat-Sheets
npm install
npm run build
bundle install
bundle exec jekyll serve
```

## 📄 Créditos e Licenciamento de Terceiros

Este projeto utiliza partes modificadas do repositório [vscode-markdown-pdf](https://github.com/yzane/vscode-markdown-pdf), mantido por yzane.

Essas partes estão localizadas em `scripts/markdown-pdf/` e seguem a licença MIT original, incluída em `scripts/markdown-pdf/LICENSE`.

## 📜 Licença

Este projeto utiliza a licença MIT, incluida em [LICENSE](./LICENSE).