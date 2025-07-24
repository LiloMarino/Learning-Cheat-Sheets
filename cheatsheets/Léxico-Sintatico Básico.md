# 📝 Léxico-Sintático Básico

## 🧩 Análise Léxica

### 🎯 Objetivo

Converter uma entrada bruta (código-fonte ou sequência de caracteres) em uma **lista de tokens** reconhecidos por um **autômato** ou lógica sequencial.

---

### 🔶 Etapas

#### ✅ 1. Identifique todos os terminais/tokens da gramática

* `id`
* `+`
* `*`
* `++`
* `(`
* `)`
* `$`

---

#### ✅ 2. Definir os tokens

Use um `enum` com identificadores únicos para cada tipo de token.

🟦 Versão em **C**:

```c
enum TokenType {
    TOK_ID = 0, TOK_PLUS, TOK_STAR, TOK_PLUSPLUS,
    TOK_LPAREN, TOK_RPAREN, TOK_DOLLAR, TOK_UNKNOWN
};
```

🟪 Versão em **C++**:

```cpp
enum class TokenType {
    TOK_ID = 0, TOK_PLUS, TOK_STAR, TOK_PLUSPLUS,
    TOK_LPAREN, TOK_RPAREN, TOK_DOLLAR, TOK_UNKNOWN
};
```

---

#### ✅ 3. Implementar o lexer (scanner)

* Percorrer a string caractere por caractere
* Ignorar espaços, caso necessário
* Comparar símbolos com **strings fixas** (modo simplificado, porém não é ideal para gramáticas complexas)
* **A ordem das verificações define a prioridade dos tokens.**

  * **Do topo para baixo: maior prioridade → menor prioridade**
  * Isso é essencial para evitar ambiguidades!

🔁 **Exemplo crítico**:
Para a entrada `++`:

* Se o `+` for testado **antes** do `++`, o lexer reconhecerá `+` e depois `+` (`TOK_PLUS TOK_PLUS`)
* Se o `++` for testado **antes**, o lexer reconhecerá `++` corretamente (`TOK_PLUSPLUS`)

🔽 Portanto, **sempre teste lexemas mais longos primeiro** e fique atento as prioridades.

🟦 Versão em **C**:

```c
int next_token(const char *line, int *pos) {
    // Ignora os espaços
    while (isspace(line[*pos]))
    {
        (*pos)++;
    } 

    if (line[*pos] == '\0')
    {
        return TOK_UNKNOWN;
    }

    // Ordem de prioridade: maiores lexemas primeiro!
    if (line[*pos] == '+' && line[*pos + 1] == '+') {
        *pos += 2; return TOK_PLUSPLUS;
    }
    if (line[*pos] == '+' ) {
        *pos += 1; return TOK_PLUS;
    }
    if (line[*pos] == '*') {
        *pos += 1; return TOK_STAR;
    }
    if (line[*pos] == '(') {
        *pos += 1; return TOK_LPAREN;
    }
    if (line[*pos] == ')') {
        *pos += 1; return TOK_RPAREN;
    }
    if (line[*pos] == '$') {
        *pos += 1; return TOK_DOLLAR;
    }
    if (line[*pos] == 'i' && line[*pos + 1] == 'd') {
        *pos += 2; return TOK_ID;
    }

    (*pos)++;
    return TOK_UNKNOWN;
}
```

🟪 Versão em **C++**:

```cpp
TokenType next_token(const std::string& line, size_t& pos) {
    // Ignora os espaços
    while (isspace(line[pos]))
    {
        ++pos;
    }

    if (pos >= line.size())
    {
        return TokenType::TOK_UNKNOWN;
    }

    // Ordem de prioridade: maiores lexemas primeiro!
    if (line[pos] == '+' && line[pos + 1] == '+') {
        pos += 2; return TokenType::TOK_PLUSPLUS;
    }
    if (line[pos] == '+') {
        ++pos; return TokenType::TOK_PLUS;
    }
    if (line[pos] == '*') {
        ++pos; return TokenType::TOK_STAR;
    }
    if (line[pos] == '(') {
        ++pos; return TokenType::TOK_LPAREN;
    }
    if (line[pos] == ')') {
        ++pos; return TokenType::TOK_RPAREN;
    }
    if (line[pos] == '$') {
        ++pos; return TokenType::TOK_DOLLAR;
    }
    if (line[pos] == 'i' && line[pos + 1] == 'd') {
        pos += 2; return TokenType::TOK_ID;
    }

    ++pos;
    return TokenType::TOK_UNKNOWN;
}
```

---

#### ✅ 4. Imprimir tokens (debugging)

🟦 Versão em **C**:

```c
printf("%d ", token);  // Ex: 0 1 2 6
```

🟪 Versão em **C++**:

```cpp
std::cout << static_cast<int>(token) << " ";  // Ex: 0 1 2 6
```

## 📐 Análise Sintática LL(1) (Versão Descendente Recursiva)

## 🎯 Objetivo

Interpretar uma **sequência de tokens** (gerada pelo lexer) de acordo com uma **gramática livre de contexto**, validando a **estrutura** da entrada e possibilitando a **tradução/execução**.

## 🔷 LL(1): Características

* **L**eft-to-right: analisa da esquerda para a direita
* **L**eftmost derivation: derivações mais à esquerda
* **1** token de lookahead (pré-visualização)

### 🔶 Etapas

#### ✅ 1. Defina a gramática

```bnf
S → E $
E → T R
R → + T R | ε
T → id
```

Essa gramática reconhece expressões como:

* `id $`
* `id + id $`
* `id + id + id $`

---

### ✅ 2. Calcule `FIRST`, `FOLLOW`, `NULLABLE`

#### 🟨 FIRST Sets:

* `FIRST(id) = { id }`
* `FIRST(+) = { + }`
* `FIRST(E) = FIRST(T) = FIRST(id) = { id }`
* `FIRST(R) = { +, ε }`
* `FIRST(T) = { id }`

#### 🟦 Nullable:

* `R` é nullable (tem uma produção ε)

#### 🟧 FOLLOW Sets:

* `FOLLOW(S) = { $ }`
* `FOLLOW(E) = { $ }`
* `FOLLOW(R) = { $ }`
* `FOLLOW(T) = { +, $ }`

---

### ✅ 3. Construa a tabela LL(1)

| Não-terminal | `id`        | `+`     | `$`     |
| ------------ | ----------- | ------- | ------- |
| `S`          | `S → E $`   |         |         |
| `E`          | `E → T R`   |         |         |
| `R`          | `R → + T R` | `R → ε` | `R → ε` |
| `T`          | `T → id`    |         |         |

---

### ✅ 4. Representação da tabela

#### 🟦 Em C:

```c
enum NonTerm { S_NT = 0, E_NT, R_NT, T_NT };
enum Term { ID = 0, PLUS, DOLLAR };

int table[4][3] = {
/*           id   +     $   */
/* S_NT */ {  1 , -1 ,  -1 },
/* E_NT */ {  2 , -1 ,  -1 },
/* R_NT */ {  3 ,  4 ,   4 },
/* T_NT */ {  5 , -1 ,  -1 }
};
// 1 = S → E $, 2 = E → T R, 3 = R → + T R, 4 = R → ε, 5 = T → id
```

#### 🟪 Em C++:

```cpp
enum class NonTerm { S = 0, E, R, T };
enum class Term { ID = 0, PLUS, DOLLAR };

int table[4][3] = {
/*           ID  PLUS DOLLAR */
/* S */     {  1 , -1 ,  -1 },
/* E */     {  2 , -1 ,  -1 },
/* R */     {  3 ,  4 ,   4 },
/* T */     {  5 , -1 ,  -1 }
};
```

---

### ✅ 5. Implementação do Parser (descendente recursivo)

#### 🟦 Em C:

```c
void S() {
    E();
    eat(TOK_DOLLAR);
}

void E() {
    T();
    R();
}

void R() {
    if (token == TOK_PLUS) {
        eat(TOK_PLUS);
        T();
        R();
    }
    // else: ε (fazer nada)
}

void T() {
    eat(TOK_ID);
}
```

#### 🟪 Em C++:

```cpp
void S() {
    E();
    eat(TokenType::TOK_DOLLAR);
}

void E() {
    T();
    R();
}

void R() {
    if (token == TokenType::TOK_PLUS) {
        eat(TokenType::TOK_PLUS);
        T();
        R();
    }
    // else: ε
}

void T() {
    eat(TokenType::TOK_ID);
}
```

---

### ✅ 6. Funções auxiliares

#### 🟦 Em C:

```c
void eat(int expected) {
    if (token == expected)
        advance();
    else
        error("Token inesperado");
}
```

#### 🟪 Em C++:

```cpp
void eat(TokenType expected) {
    if (token == expected)
        advance();
    else
        error("Unexpected token");
}
```

---

### ✅ 7. Exemplo de uso

Entrada: `id + id + id $`
Tokens: `TOK_ID TOK_PLUS TOK_ID TOK_PLUS TOK_ID TOK_DOLLAR`

Chamada de `S()`:

```text
S()
└── E()
    ├── T() → eat(id)
    └── R()
        ├── eat(+)
        ├── T() → eat(id)
        └── R()
            ├── eat(+)
            ├── T() → eat(id)
            └── R() → ε
```

---

## ⚠️ Observações importantes

* A **ordem das regras** nos `switch-case` segue os conjuntos `FIRST`/`FOLLOW` da gramática.
* O símbolo `ε` (vazio) é implementado como **"não fazer nada"** em muitas linguagens.
* **Atenção especial para conflitos léxicos**, como `+` vs `++`:

  * Se você define `++` como token, ele deve ter **prioridade maior** na análise léxica:

    ```c
    if (line[pos] == '+' && line[pos+1] == '+') {
        pos += 2; return TOK_PLUSPLUS;
    }
    if (line[pos] == '+') {
        pos++; return TOK_PLUS;
    }
    ```


