# MacarTech Security AI — Status para continuidade

Atualizado em 2026-10-08. Contexto de arquitetura e regras: `.ai/project-context.md`. Sem secrets neste arquivo.

## Onde estamos
- F1 (auditoria): concluída.
- F2 (instalar, pytest, typecheck, lint, build): concluída.
- F3 a F9: ainda não executadas formalmente. Parte da F4 (Gemini real) e da F5 (tokens) foi adiantada para destravar o deploy.
- Nada foi commitado nem enviado ao GitHub. Remote `origin` = https://github.com/macartechsand/securityai.git (já configurado, sem push).

## Validado
- `pytest` offline: 72 passed (4 testes `live` desmarcados por padrão).
- `npm run typecheck` e `npm run build`: OK. `npm run lint`: 0 erros, 3 warnings de react-refresh (ignorados).
- Gemini real: modo Simple responde completo; redação de senha enviada pelo usuário funciona (`secret_detected`, senha não chega ao modelo).

## Alterações feitas (não commitadas)
- F2: removidos imports não usados em `Footer.tsx` e nas páginas (Contact, Cookies, LGPD, Privacy, Services, Terms).
- Modelo padrão: `gemini-2.5-flash` -> `gemini-3.5-flash` (o 2.5 retorna 404 para contas novas). Alterado em `config.py`, `backend/.env.example`, `render.yaml`, `README.md`, `docs/ARCHITECTURE.md`.
- `GEMINI_THINKING_LEVEL=minimal` (novo; vence `GEMINI_THINKING_BUDGET`). Em modelos 3.x o budget=0 parece não desligar o raciocínio.
- `providers/base.py`: novo `ModelAnswer(text, truncated)`; `generate()` agora retorna `ModelAnswer`.
- `providers/gemini.py`: `_post()` separado, 1 retry em HTTP 503, `truncated` quando `finishReason == MAX_TOKENS`.
- `orchestrator.py`: limite de saída do Technical = `MAX_OUTPUT_TOKENS_TECHNICAL` (2048); aviso `truncated` na resposta.
- Frontend: nota de truncamento em `Chat.tsx` e textos EN/PT em `LanguageContext.tsx`.
- Testes novos em `test_gemini_provider.py` e `test_chat.py`.

## Decisões recentes (2026-10-08)
- Modelo: `gemini-3.5-flash-lite` (cota diária gratuita de 500 req; o `gemini-3.5-flash` tem só 20/dia e esgotou).
- `truncated`: com flash-lite, pelo caminho do app, 3/3 chamadas terminaram com `finishReason=STOP` (sem tokens de raciocínio). A detecção está correta. O falso positivo visto no `gemini-3.5-flash` não foi reproduzido (cota esgotada); reinvestigar só se voltar a esse modelo.
- Limites diários (`DailyQuota` em `core/rate_limit.py`): 20 perguntas/dia por IP e 400/dia no total (abaixo dos 500 do Gemini), reset 08:00 UTC. Falha do modelo devolve a cota. HTTP 429 do Gemini vira 429 `daily_limit_global`. A resposta traz `remaining_today` e a UI mostra o contador.
- Prompt: regra de idioma reforçada (o flash-lite respondia em inglês a perguntas em português).
- Deploy: `netlify.toml` criado; `requirements.txt` fixado; `PYTHON_VERSION=3.12.7` no `render.yaml`.

## Ambiente local
- Backend: `cd backend && .venv/Scripts/python -m uvicorn app.main:app --port 8000`. Testes: `.venv/Scripts/python -m pytest -q`.
- Frontend: `npm run dev` (proxy /api para localhost:8000).
- `backend/.env` (no .gitignore) tem `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite` e `GEMINI_THINKING_LEVEL=minimal`. A chave nunca deve ir ao chat, ao Git ou a variáveis `VITE_*`.
- No Windows, matar o servidor com `taskkill //F //IM python.exe` antes de reiniciar após mudar o `.env`.
- Curl no Git Bash quebra acentos no JSON; use Python (httpx) para testar com acentos.

## Pendências por fase
- F3: testes de frontend (envio, Simple/Technical, loading, erro, resposta) com fetch mockado. Exige `jsdom` e `@testing-library/react` (pedir aprovação) e script `npm test`.
- F5: ler `usageMetadata` (tokens de entrada, saída e total), log estruturado com modelo, duração e custo estimado (preço por env), teto de chamadas por sessão (só se justificável). Cache: não implementar sem recorrência real.
- F6: completar testes de segurança (prompt injection básico, payload grande, request inválido).
- F7: evaluation suite com ~16 casos em `backend/evals/` e runner simples.
- F8: `netlify.toml` e pin feitos; falta alinhar o texto de deploy do README.
- F9: fluxo completo e checklist de MVP pronto.
- Observação: o Gemini devolve 503 com frequência (demanda alta). Há 1 retry; se persistir, avaliar `MODEL_TIMEOUT_SECONDS`.

## Deploy (plano)
- Frontend: Netlify (`VITE_API_BASE_URL` = URL pública do Render, sem barra final; rebuild após mudar).
- Backend: Render via `render.yaml`; no painel definir `GEMINI_API_KEY` e `CORS_ORIGINS` (URL do Netlify, sem barra final). `TRUST_PROXY_HEADERS=true` já está no yaml.
- Render free dorme quando ocioso; o primeiro request pode passar de 35 s (timeout do frontend).
- Depois do deploy: `curl https://<api>/api/health`, uma pergunta Simple e uma Technical pelo site, e checar que o bundle `dist/` não contém a chave.
- Commit e push só com confirmação explícita do usuário.

## Fora de escopo (apenas TODO)
DB, autenticação, RAG, vector DB, SIEM/SOAR, integrações enterprise, remediation, multi-provider, roteamento de modelos, fine-tuning.
