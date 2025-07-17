---
title: Conjuntos de Nullable, First e Follow
description: Explicação sobre Nullable, First e Follow no contexto de compiladores
---
## ✅ Cheat Sheet: Nullable, First e Follow

### 🟡 Nullable (Quem pode gerar cadeia vazia?)

> **`X` é nullable se existe alguma produção que permite `X ⇒* ε`**

#### ✅ Regras para calcular `Nullable(X)`:

| Produção           | O que fazer                                                    |
| ------------------ | -------------------------------------------------------------- |
| `X → ε`            | Marque `X` como nullable                                       |
| `X → Y₁ Y₂ ... Yn` | Se **todos os `Yi` são nullable**, então `X` também é nullable |

---

### 🔵 FIRST (Quais símbolos terminais podem aparecer no início de `X`?)

> Para cada **produção de `X → α`**, calcule quais terminais podem iniciar essa derivação.

#### ✅ Regras para calcular `FIRST(X)`:

| Produção                         | Ação para montar `FIRST(X)`                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `X → a ...` (`a` é terminal)     | Adicione `a` a `FIRST(X)`                                     |
| `X → Y ...` (`Y` é não-terminal) | Adicione `FIRST(Y)` a `FIRST(X)`                              |
| `X → Y₁ Y₂ ... Yn`               | Vá da esquerda pra direita:<br> Para cada `Yi`:               |
|                                  | ➤ Adicione `FIRST(Yi)` a `FIRST(X)`                           |
|                                  | ➤ Se `Yi` **não é nullable**, pare                            |
|                                  | ➤ Se **todos** os `Yi` são nullable, continue                 |
|                                  | Obs: **Não adicione ε ao FIRST(X)** (segundo o seu professor) |

🟨 **Dica importante sobre ciclos:**
Se `X → Y` e `Y → X` (ou algo similar), **isso não é problema**. Apenas propague os `FIRST` normalmente. Se `Y` tem uma produção como `Y → d`, então `FIRST(X) = {d}`.
✅ **Não precisa se preocupar com loops — basta seguir as regras acima.**

---

### 🟣 FOLLOW (Quais símbolos terminais podem vir **logo após** `X`?)

> Usado para prever qual produção escolher. Aplica-se **nas produções onde `X` aparece à direita**.

#### ✅ Regras para calcular `FOLLOW(X)`:

| Contexto da produção          | Ação sobre `FOLLOW(X)`                                                             |
|------------------------------|-------------------------------------------------------------------------------------|
| Produção `A → α X β`         | Vá da esquerda para a direita na produção `A → α X₁ X₂ ... Xn`:<br> Para cada `Xi`: |
|                              | ➤ Adicione `FIRST(β)` a `FOLLOW(Xi)`                                               |
|                              | ➤ Se `β` for **nullable**, adicione também `FOLLOW(A)` a `FOLLOW(Xi)`              |
|                              | ➤ Se `β` não existir (ou for vazio), adicione `FOLLOW(A)` a `FOLLOW(Xi)`           |
| Produção `A → α X` (X no fim) | ➤ Adicione `FOLLOW(A)` a `FOLLOW(X)`                                               |

---

## ✅ Notas práticas:

* `Nullable(X)` ajuda a **decidir se deve continuar olhando o próximo símbolo** ao montar `FIRST` e `FOLLOW`.
* Ao montar `FIRST(X)`, percorra **cada produção `X → α`**, e aplique as regras da esquerda para a direita.
* `FIRST` = **terminais que podem iniciar α** (α é o lado direito da produção: por exemplo, em X → α, α pode ser algo como a B C)
* `FOLLOW` = **terminais que podem vir logo depois de X em alguma derivação**
* Monte os conjuntos na ordem:

  1. Nullable
  2. FIRST
  3. FOLLOW

🟨 **Dica prática sobre loops em `FIRST` e `FOLLOW`:**
Se, ao montar `FIRST(X)` ou `FOLLOW(X)`, você se deparar com uma expressão do tipo `FIRST(X) = FIRST(X) ∪ ...` ou `FOLLOW(X) = FOLLOW(X) ∪ ...`, **ignore temporariamente o conjunto de si mesmo (o próprio `X`):**
```
FIRST(X) = FIRST(X) ∪ FIRST (Y) U ...
FIRST(X) = FIRST(Y) U ...

FOLLOW(X) = FOLLOW(X) ∪ FOLLOW (Y) U ...
FOLLOW(X) = FOLLOW(Y) U ...
```
---

## ✅ Exemplo completo com as regras aplicadas

### Gramática:

```
S → A B  
A → a | ε  
B → b
```

### 🟡 Nullable:

* `A → ε` → ✅ `A` é nullable
* `B → b` → ❌ `B` não é nullable
* `S → A B` → `A` é nullable, `B` não → ❌ `S` não é nullable
  ✅ `Nullable = {A}`

---

### 🔵 FIRST:

#### Para `A → a | ε`:

* `FIRST(A) = {a}` (ε não entra!)

#### Para `B → b`:

* `FIRST(B) = {b}`

#### Para `S → A B`:

* `A` pode gerar `a` ou ε ⇒ olhe também `B`
* `FIRST(S) = FIRST(A) ∪ FIRST(B) = {a} ∪ {b} = {a, b}`
  ✅ `FIRST(S) = {a, b}`

---

### 🟣 FOLLOW:

* `FOLLOW(S) = {}` (símbolo inicial)
* `S → A B`

  * `B` está no final → `FOLLOW(B) += FOLLOW(S) = {}`
  * `A` vem antes de `B`:

    * `FIRST(B) = {b}` → `FOLLOW(A) += {b}`

✅ `FOLLOW(A) = {b}`
✅ `FOLLOW(B) = {}`

---

## ✅ Resumo visual final

```text
Nullable:
  A → ε           ⇒ Nullable(A)
  S → A B         ⇒ A é nullable, mas B não ⇒ S não é nullable

FIRST:
  FIRST(A) = {a}
  FIRST(B) = {b}
  FIRST(S) = FIRST(A) ∪ FIRST(B) = {a, b}

FOLLOW:
  FOLLOW(S) = {}
  FOLLOW(A) = {b}
  FOLLOW(B) = {}
```
