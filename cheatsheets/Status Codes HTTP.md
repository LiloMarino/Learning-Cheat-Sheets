---
title: "APIs REST: Status Codes HTTP"
description: Guia completo e atualizado dos códigos de status HTTP, incluindo todos listados na MDN, com exemplos práticos, dicas de uso e boas práticas para APIs REST.
---

# 🌐 Status Codes HTTP

> Os **códigos de status HTTP** indicam o resultado de uma requisição.  
> Em APIs REST, usar o código correto torna a comunicação **clara, padronizada e previsível**.

---

## 🔹 Dicas gerais de uso em APIs REST

- 🎯 Use o **código mais específico possível**; não abuse de `200` e `500`.  
- 📦 Sempre que possível, combine com **respostas JSON informativas**:

```http
POST /tasks
{
  "title": "Aprender status codes"
}
→
201 Created
{
  "id": 12,
  "message": "Tarefa criada com sucesso"
}
````

* 🚫 Evite `200 OK` para erros; prefira `4xx` ou `5xx`.
* ⚡ Aproveite **2xx** para sucesso, **3xx** para redirecionamento, **4xx** para cliente, **5xx** para servidor.
* 💡 **REST tip:** códigos idempotentes (`PUT`, `DELETE`) combinam bem com `204 No Content`.

---

## 🔹 Classes de status codes

| Faixa   | Categoria        | Significado geral                                           |
| :------ | :--------------- | :---------------------------------------------------------- |
| **1xx** | Informacional    | Pedido recebido; cliente deve continuar esperando.          |
| **2xx** | Sucesso          | Pedido processado com sucesso.                              |
| **3xx** | Redirecionamento | Cliente precisa de ação adicional (seguir URL, método etc.) |
| **4xx** | Erro do cliente  | Requisição inválida ou não autorizada.                      |
| **5xx** | Erro do servidor | Servidor falhou ao processar requisição válida.             |

> ⚠️ Dica REST: **1xx** raramente usado em APIs, geralmente só para handshakes ou long polling.

---

## 🔹 1xx — Informacional

| Código | Nome                | Significado                                                    | Exemplo                  |
| :----- | :------------------ | :------------------------------------------------------------- | :----------------------- |
| 100    | Continue            | O cliente pode continuar enviando o corpo da requisição.       | Uploads longos.          |
| 101    | Switching Protocols | Servidor trocando protocolo (HTTP → WebSocket).                | Handshake WebSocket.     |
| 102    | Processing          | Pedido recebido, ainda processando (WebDAV).                   | Operações assíncronas.   |
| 103    | Early Hints         | Servidor envia headers antecipados antes da resposta completa. | Pré-carregamento CSS/JS. |

---

## 🔹 2xx — Sucesso

> Indicam que a requisição foi **processada com sucesso**.
> 💡 REST tip: `201` para criação, `204` para sucesso sem corpo.

| Código | Nome                          | Significado                                           | Exemplo                                |
| :----- | :---------------------------- | :---------------------------------------------------- | :------------------------------------- |
| 200    | OK                            | Requisição bem-sucedida.                              | `GET /tasks` retorna lista de tarefas. |
| 201    | Created                       | Recurso criado com sucesso.                           | `POST /tasks` → nova tarefa.           |
| 202    | Accepted                      | Pedido aceito, processamento ainda não concluído.     | Jobs assíncronos.                      |
| 203    | Non-Authoritative Information | Resposta proveniente de fonte não autoritativa.       | Proxy modificando resposta.            |
| 204    | No Content                    | Pedido concluído sem corpo de resposta.               | `DELETE /tasks/3`.                     |
| 205    | Reset Content                 | Cliente deve resetar formulário/estado.               | Reset formulário web.                  |
| 206    | Partial Content               | Responde parcialmente a uma requisição com `Range:`.  | Downloads segmentados.                 |
| 207    | Multi-Status                  | WebDAV; múltiplos resultados.                         | Operações em vários arquivos.          |
| 208    | Already Reported              | WebDAV; evita repetir info em multistatus.            | —                                      |
| 226    | IM Used                       | Requisição terminou; recurso em múltiplas instâncias. | —                                      |

---

## 🔹 3xx — Redirecionamento

> Indicam que o cliente deve **seguir outro caminho** ou **usar outro método**.
> 💡 REST tip: prefira `307` ou `308` para redirecionamentos em APIs, mantendo o método HTTP.

| Código | Nome                   | Significado                                        | Exemplo                               |
| :----- | :--------------------- | :------------------------------------------------- | :------------------------------------ |
| 300    | Multiple Choices       | Recurso possui múltiplas opções; cliente escolhe.  | `/file` → PDF ou DOCX.                |
| 301    | Moved Permanently      | Recurso movido permanentemente.                    | `/old → /new`.                        |
| 302    | Found                  | Redirecionamento temporário.                       | Logins.                               |
| 303    | See Other              | Resposta a POST deve usar GET na URL indicada.     | Redirecionar após criação de recurso. |
| 304    | Not Modified           | Recurso não mudou; usar cache.                     | Evita download duplicado.             |
| 305    | Use Proxy *(obsoleto)* | Cliente deve acessar recurso via proxy.            | Raramente usado.                      |
| 306    | *(Reservado)*          | Uso antigo descontinuado.                          | —                                     |
| 307    | Temporary Redirect     | Redirecionamento temporário, preserva método HTTP. | APIs REST seguras.                    |
| 308    | Permanent Redirect     | Redirecionamento permanente, preserva método HTTP. | Atualização de rota.                  |

---

## 🔹 4xx — Erros do Cliente

> Indicam problemas na requisição do cliente.
> 💡 REST tip: use códigos específicos (`422` para validação, `404` para ausência).

| Código | Nome                            | Significado                               | Exemplo                      |
| :----- | :------------------------------ | :---------------------------------------- | :--------------------------- |
| 400    | Bad Request                     | Requisição malformada.                    | JSON inválido.               |
| 401    | Unauthorized                    | Requer autenticação.                      | Token ausente ou inválido.   |
| 402    | Payment Required                | Reservado; geralmente não usado.          | —                            |
| 403    | Forbidden                       | Autenticado, sem permissão.               | Acesso admin negado.         |
| 404    | Not Found                       | Recurso inexistente.                      | `/tasks/999`.                |
| 405    | Method Not Allowed              | Método HTTP não suportado.                | `POST /users/1`.             |
| 406    | Not Acceptable                  | Recurso não suporta tipo solicitado.      | `Accept: application/xml`.   |
| 407    | Proxy Authentication Required   | Cliente precisa autenticar via proxy.     | —                            |
| 408    | Request Timeout                 | Cliente demorou muito.                    | Requests lentos.             |
| 409    | Conflict                        | Conflito de estado.                       | Dados duplicados.            |
| 410    | Gone                            | Recurso removido permanentemente.         | Endpoint antigo.             |
| 411    | Length Required                 | `Content-Length` ausente.                 | Upload sem tamanho definido. |
| 412    | Precondition Failed             | Condições de pré-requisição falharam.     | `If-Match` falhou.           |
| 413    | Payload Too Large               | Requisição muito grande.                  | Arquivo excede limite.       |
| 414    | URI Too Long                    | URI muito longa.                          | Query string extensa.        |
| 415    | Unsupported Media Type          | Tipo de mídia não suportado.              | Enviar XML em API JSON.      |
| 416    | Range Not Satisfiable           | Intervalo inválido para download parcial. | `Range: 1000-500`.           |
| 417    | Expectation Failed              | Expectativa no header não atendida.       | `Expect: 100-continue`.      |
| 418    | I'm a Teapot ☕                  | Piada RFC 2324; easter egg.               | —                            |
| 421    | Misdirected Request             | Pedido enviado para servidor errado.      | HTTP/2 multiplex.            |
| 422    | Unprocessable Entity            | Sintaxe ok, mas dados inválidos.          | Campo obrigatório ausente.   |
| 423    | Locked                          | Recurso bloqueado (WebDAV).               | Arquivo em uso.              |
| 424    | Failed Dependency               | Operação depende de outra que falhou.     | WebDAV.                      |
| 425    | Too Early                       | Evitar replay prematuro de requisições.   | Pré-processamento.           |
| 426    | Upgrade Required                | Cliente precisa mudar protocolo.          | `Upgrade: TLS/2`.            |
| 428    | Precondition Required           | Servidor exige condições (`If-Match`).    | Evita sobrescrever dados.    |
| 429    | Too Many Requests               | Limite de requisições excedido.           | Rate limiting.               |
| 431    | Request Header Fields Too Large | Headers muito grandes.                    | Cookies enormes.             |
| 451    | Unavailable For Legal Reasons   | Bloqueio legal ou censura.                | DMCA, restrições regionais.  |

---

## 🔹 5xx — Erros do Servidor

> Indicam falha do servidor em processar uma requisição aparentemente válida.
> 💡 REST tip: use logs, monitoramento e mensagens JSON claras.

| Código | Nome                            | Significado                                  | Exemplo                   |
| :----- | :------------------------------ | :------------------------------------------- | :------------------------ |
| 500    | Internal Server Error           | Erro genérico do servidor.                   | Exceção não tratada.      |
| 501    | Not Implemented                 | Funcionalidade não suportada.                | Endpoint ausente.         |
| 502    | Bad Gateway                     | Proxy recebeu resposta inválida.             | API externa falhou.       |
| 503    | Service Unavailable             | Servidor indisponível.                       | Manutenção, sobrecarga.   |
| 504    | Gateway Timeout                 | Proxy demorou para responder.                | Serviço downstream lento. |
| 505    | HTTP Version Not Supported      | Versão HTTP não suportada.                   | Cliente antigo.           |
| 506    | Variant Also Negotiates         | Negociação de conteúdo falhou.               | —                         |
| 507    | Insufficient Storage            | Servidor sem espaço (WebDAV).                | Upload falhou.            |
| 508    | Loop Detected                   | Loop de referência detectado (WebDAV).       | —                         |
| 510    | Not Extended                    | Requisição não atende extensões necessárias. | —                         |
| 511    | Network Authentication Required | Autenticação de rede necessária.             | Wi-Fi corporativo.        |

---

## 🧭 Leituras adicionais

* 📘 [MDN Web Docs — HTTP Status Codes](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status)
  Guia completo e atualizado da Mozilla explicando cada código, categoria e casos de uso recomendados.

* 📙 [RFC 9110 — HTTP Semantics (IETF)](https://datatracker.ietf.org/doc/html/rfc9110#name-status-codes)
  Especificação oficial dos códigos de status e definições formais segundo o padrão HTTP moderno.

* 📗 [REST API Tutorial — HTTP Status Codes](https://restfulapi.net/http-status-codes/)
  Explicações práticas e exemplos de uso de status codes em APIs REST.
