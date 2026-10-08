# MacarTech Security AI — Status para continuidade

Atualizado em 2026-10-08. Regras e arquitetura: `.ai/project-context.md`. Este arquivo não contém secrets.

## Resumo
O MVP está **no ar e validado como usuário**.

| Componente | Onde | Observação |
|---|---|---|
| Site | https://security-ai.netlify.app | Netlify, projeto novo ligado ao repo, lê `netlify.toml` |
| API | https://macartech-security-ai-api.onrender.com | Render free via `render.yaml`; dorme quando ocioso (cold start ~20 s) |
| Modelo | `gemini-3.5-flash-lite` | Cota gratuita ~500 req/dia; `GEMINI_THINKING_LEVEL=minimal` |
| Código | https://github.com/macartechsand/securityai | `main` = produção; mudanças via branch + PR |

Fluxo: navegador → Netlify (estático) → Render (FastAPI) → Gemini. A chave do Gemini existe só no Render e no `backend/.env` local; o bundle público foi verificado sem chave.

## Histórico (2026-10-08)
1. **F1 Auditoria**: o repo já tinha backend, frontend, testes e `render.yaml` bem estruturados. Faltavam: métricas de tokens, tratamento de truncamento, limites diários, evals, testes de frontend e config Netlify.
2. **F2 Execução**: deps instaladas; typecheck/lint falhavam por imports não usados (corrigido).
3. **Modelo**: `gemini-2.5-flash` retorna 404 para contas novas. `gemini-3.5-flash` funcionou, mas a cota gratuita é de **20 req/dia** e esgotou. Escolhido `gemini-3.5-flash-lite` (500/dia).
4. **Thinking**: nos modelos 3.x, `thinkingBudget=0` não impede o raciocínio de consumir o limite de saída. Criado `GEMINI_THINKING_LEVEL` (`minimal`), que tem precedência.
5. **Truncamento**: o provider marca `truncated` quando `finishReason=MAX_TOKENS`, e a UI mostra uma nota. Com flash-lite, 3/3 chamadas Technical terminaram com `STOP` (~800–900 tokens). Um falso positivo visto no `gemini-3.5-flash` não pôde ser reproduzido (cota); reinvestigar só se voltar a esse modelo.
6. **Retry**: 1 nova tentativa automática em HTTP 503 (o Gemini devolve 503 com frequência por alta demanda).
7. **Limites diários** (pedido do usuário, "estilo bolt"): ver seção abaixo.
8. **Idioma**: o flash-lite respondia em inglês a perguntas em português e misturava títulos ("Por que it matters"). Os prompts agora listam os títulos em EN e PT de forma condicional ao idioma da pergunta. Validado em produção (PR #1).
9. **Deploy**: `netlify.toml`, versões Python fixadas, `PYTHON_VERSION` no Render. O primeiro erro em produção foi CORS (`CORS_ORIGINS` ainda com localhost), corrigido no painel do Render.

## Limites e proteção de custo (estado atual)
| Limite | Valor padrão | Variável |
|---|---|---|
| Requisições por minuto por IP | 20 / 60 s | `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` |
| Perguntas por dia por IP ("usuário") | 20 | `DAILY_LIMIT_PER_USER` |
| Perguntas por dia no serviço todo | 400 (abaixo dos 500 do Gemini) | `DAILY_LIMIT_GLOBAL` |
| Reset diário | 08:00 UTC (05:00 Brasília) | `DAILY_RESET_UTC_HOUR` |
| Tamanho da mensagem | 2000 caracteres | `MAX_MESSAGE_CHARS` |
| Histórico enviado | 10 mensagens, 6000 caracteres cada | `MAX_HISTORY_MESSAGES`, `MAX_HISTORY_CHARS` |
| Saída Simple / Technical | 1024 / 2048 tokens | `MAX_OUTPUT_TOKENS`, `MAX_OUTPUT_TOKENS_TECHNICAL` |
| Timeout do modelo | 25 s (frontend: 35 s) | `MODEL_TIMEOUT_SECONDS` |
| Corpo da requisição | 64 KB | fixo em `main.py` |

Comportamento:
- Falha do modelo **devolve** a pergunta à cota do usuário.
- HTTP 429 do Gemini vira 429 `daily_limit_global` ("capacidade diária atingida").
- Respostas 429 trazem `code` (`rate_limited`, `daily_limit_user`, `daily_limit_global`) e `Retry-After`.
- A resposta de sucesso traz `remaining_today`; a UI mostra "N perguntas restantes hoje".
- Contadores ficam **em memória**: zeram quando o Render reinicia, faz redeploy ou acorda. A cota do próprio Gemini é a proteção final.
- "Usuário" = IP, porque não há login. Pessoas na mesma rede compartilham a cota.

## Validado
- `pytest` offline: **79 passed** (4 testes `live` só com `-m live`).
- `npm run typecheck`, `npm run build`: OK. `npm run lint`: 0 erros, 3 warnings de react-refresh (preexistentes, ignorados).
- Produção (Gemini real), modo Simple: MFA, phishing, proteção de Instagram, alerta de login; senha enviada é redigida (`secret_detected`) e não volta na resposta; pedido de revelar o system prompt é recusado; títulos corretos em PT e EN.
- Produção, modo Technical: títulos e estrutura corretos (Evidências, O que pode explicar...).
- CORS: só `https://security-ai.netlify.app` (e o que estiver em `CORS_ORIGINS`).

## Arquivos-chave alterados nesta sessão
- `backend/app/providers/base.py`: `ModelAnswer(text, truncated)`, `ProviderQuotaExceeded`.
- `backend/app/providers/gemini.py`: `_post()`, retry em 503, 429 → quota, `thinkingLevel`, `truncated`.
- `backend/app/core/rate_limit.py`: `DailyQuota`.
- `backend/app/core/config.py`: novas variáveis (modelo, thinking level, limites diários, saída Technical).
- `backend/app/api/chat.py`: aplica cota diária, devolve `remaining_today`, respostas 429 com `code`.
- `backend/app/main.py`: cria `DailyQuota`, handler de quota, `expose_headers=["Retry-After"]`.
- `backend/app/orchestrator/orchestrator.py`: limite de saída por modo, aviso `truncated`.
- `backend/app/prompts/{base,simple,technical}.py`: idioma e títulos.
- `src/components/Chat.tsx`, `src/services/chatApi.ts`, `src/types/index.ts`, `src/contexts/LanguageContext.tsx`: contador, mensagens de limite e truncamento.
- `netlify.toml`, `render.yaml`, `backend/requirements*.txt`, `backend/.env.example`, `README.md`, `docs/ARCHITECTURE.md`.

## Como retomar
- Local: `git checkout main && git pull`.
- Backend: `cd backend && .venv/Scripts/python -m uvicorn app.main:app --port 8000`. Testes: `.venv/Scripts/python -m pytest -q`.
- Frontend: `npm run dev` (http://localhost:5173, faz proxy de /api para a porta 8000).
- `backend/.env` (ignorado pelo Git) precisa de `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite`, `GEMINI_THINKING_LEVEL=minimal`.
- Nova mudança: criar branch → testar → PR → merge. O merge na `main` redeploya Render (backend) e Netlify (frontend) automaticamente.
- Diagnóstico de produção: `curl https://macartech-security-ai-api.onrender.com/api/health`; logs no painel do Render (só metadados, nunca conteúdo).

## Armadilhas conhecidas
- Erro "Não foi possível conectar ao servidor" no site = quase sempre `CORS_ORIGINS` no Render diferente da URL exata do Netlify (com `https://`, sem `/` final).
- Erro 502 isolado = o Gemini falhou duas vezes (503); repetir a pergunta resolve.
- Primeira pergunta após inatividade pode dar timeout (Render acordando).
- Mudar `VITE_API_BASE_URL` exige novo build no Netlify (o valor entra no bundle).
- Windows: matar o servidor local com `taskkill //F //IM python.exe` antes de reiniciar após mudar o `.env`.
- Curl no Git Bash corrompe acentos no JSON; para testar com acentos, use Python (httpx).
- Testes contra produção gastam a cota diária do seu IP.

## Pendências (próximas fases, em ordem sugerida)
1. **F5 Métricas**: ler `usageMetadata` do Gemini (tokens de entrada, saída e total) e registrar em log estruturado com modelo, duração e custo estimado (preço por env). Sem banco de dados.
2. **F7 Evals**: ~16 casos em `backend/evals/` (senha, MFA, phishing, account takeover, vazamento, login suspeito, dispositivo, recuperação, fora de escopo, malicioso, injection, secret) e um runner simples manual.
3. **F3 Testes de frontend**: envio, Simple/Technical, loading, erro, resposta, contador. Exige `jsdom` + `@testing-library/react` (pedir aprovação antes de instalar) e script `npm test`.
4. **F6 Segurança**: testes extras de prompt injection, payload grande e request inválido.
5. **F9 Validação final**: checklist de "MVP pronto" do briefing original.
- Avaliar depois: o Simple às vezes usa português de Portugal ("está a acontecer"); se incomodar, fixar "português do Brasil" no prompt.
- Avaliar depois: cotas em memória zeram a cada reinício do Render; persistência só se o uso real justificar (fora do escopo atual).

## Fora de escopo (apenas TODO)
DB, autenticação, RAG, vector DB, SIEM/SOAR, integrações enterprise, remediation, multi-provider, roteamento de modelos, fine-tuning.
