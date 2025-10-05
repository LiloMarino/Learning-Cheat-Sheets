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

Para desenvolver e visualizar o projeto localmente, consolidamos todas as etapas de *build* e execução em um único comando `npm start`.

### Dependências

  * **Node.js** (v18+) e um gerenciador de pacotes (como **npm** ou **pnpm**).
  * **Ruby** com `bundler` (para rodar o Jekyll).

### 1\. Preparação Inicial (Clone e Instalação)

Clone o repositório e use o seu gerenciador de pacotes para instalar todas as dependências (Node.js e Ruby) de uma só vez:

```bash
git clone https://github.com/LiloMarino/Learning-Cheat-Sheets.git
cd Learning-Cheat-Sheets
npm install
# ou
pnpm install
```

*O comando `npm install` (ou `pnpm install`) irá automaticamente instalar as dependências Node.js e, em seguida, executar o `bundle install` para as dependências Ruby.*

### 2\. Gerar Arquivos e Servir Localmente

Use o comando correspondente ao seu sistema operacional. Ele irá limpar, gerar os arquivos (`.pdf`, `.html`, `.md`) e iniciar o servidor Jekyll.

| Seu Sistema | Comando para Executar |
| :--- | :--- |
| **WSL, Linux, macOS** | `pnpm dev:unix` |
| **Windows (CMD/PowerShell)** | `pnpm dev:win` |

Este comando executa duas etapas em sequência:

1.  **Gera os Assets:** Cria as pastas (`assets/html`, `assets/pdfs`, `assets/markdown`) e executa os scripts de conversão de todos os arquivos `.md` para os formatos `.pdf` e `.html`.
2.  **Inicia o Servidor:** Executa o `bundle exec jekyll serve --livereload`, que sobe o servidor local com recarregamento automático.

**Acesse no navegador:** [http://localhost:4000](http://localhost:4000)

## 📄 Créditos e Licenciamento de Terceiros

Este projeto utiliza partes modificadas do repositório [vscode-markdown-pdf](https://github.com/yzane/vscode-markdown-pdf), mantido por yzane.

Essas partes estão localizadas em `scripts/markdown-pdf/` e seguem a licença MIT original, incluída em `scripts/markdown-pdf/LICENSE`.

## 📜 Licença

Este projeto utiliza a licença MIT, incluida em [LICENSE](./LICENSE).