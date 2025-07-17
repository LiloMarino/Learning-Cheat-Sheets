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

> \[!NOTE]
> Este repositório é um *template*! Clique em **“Use this template”** no topo da página para criar o seu próprio.

### 📁 Estrutura do Projeto

Após criar seu repositório, basta adicionar arquivos `.md` com front-matter na pasta `cheatsheets/`. Exemplo:

```markdown
---
title: Python Básico
description: Comandos essenciais e estruturas básicas da linguagem.
---

# Python Básico

## Variáveis
```

### 🚀 Publicando com GitHub Pages

1. Crie seu repositório a partir do template
2. Adicione suas cheatsheets em `cheatsheets/`
3. Vá em **Settings → Pages** e selecione a branch `main` (ou `gh-pages`)

Pronto! O site será publicado automaticamente com versões `.html`, `.pdf` e `.md` de cada arquivo.

## 🖥️ Rodando Localmente

### Dependências

* [Node.js](https://nodejs.org/) (v18+)
* [Ruby](https://www.ruby-lang.org/) com `bundler` (para rodar o Jekyll localmente)
* `git` instalado

### 1. Clone o projeto e instale dependências

```bash
git clone https://github.com/LiloMarino/Learning-Cheat-Sheets.git
cd Learning-Cheat-Sheets
npm install       # Instala dependências Node.js
bundle install    # Instala dependências Ruby (Jekyll)
```

### 2. Gerar arquivos (`.pdf`, `.html`, `.md`)

```bash
mkdir -p assets/html assets/pdfs assets/markdown

# Copia os .md limpos (sem front-matter)
node scripts/copy-md.js

# Converte os arquivos
for file in cheatsheets/*.md; do
  node scripts/markdown-pdf/convert.js "$file" pdf --outdir=assets/pdfs
  node scripts/markdown-pdf/convert.js "$file" html --outdir=assets/html
done
```

Isso irá:

* ✅ Copiar os `.md` para `assets/markdown/`
* ✅ Gerar `.pdf` em `assets/pdfs/`
* ✅ Gerar `.html` em `assets/html/`

### 3. Servir localmente com Jekyll

```bash
bundle exec jekyll serve --livereload
```

Acesse [http://localhost:4000](http://localhost:4000) no navegador.

## 📄 Créditos e Licenciamento de Terceiros

Este projeto utiliza partes modificadas do repositório [vscode-markdown-pdf](https://github.com/yzane/vscode-markdown-pdf), mantido por yzane.

Essas partes estão localizadas em `scripts/markdown-pdf/` e seguem a licença MIT original, incluída em `scripts/markdown-pdf/LICENSE`.

## 📜 Licença

Este projeto utiliza a licença MIT, incluida em [LICENSE](./LICENSE).