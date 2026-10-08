# MacarTech Security AI — contexto para agentes

Assistente de segurança de identidade (não é chatbot genérico). MVP público; foco: senhas, MFA, phishing, account takeover, vazamentos, sessões, login suspeito, recuperação de conta.

## Arquitetura (não alterar sem aprovação)
React+TS+Vite (Netlify) → FastAPI (Render) → ChatOrchestrator → ModelProvider → GeminiProvider → Gemini API.
- Chave `GEMINI_API_KEY` só no backend. Frontend só tem `VITE_API_BASE_URL` (pública).
- Código: `backend/app/{api,core,orchestrator,prompts,providers,schemas}`, `src/`, testes em `backend/tests`.
- Modos Simple/Technical compartilham o mesmo prompt base; só muda apresentação.

## Regras do produto
- Nunca pedir senha/OTP/token/chave; redigir secrets na entrada.
- Nunca afirmar comprometimento sem evidência; separar fato / info do usuário / possibilidade / recomendação / incerteza.
- Sem conteúdo de conversa em logs; só metadados.
- Economia de tokens é requisito: contexto mínimo, limites de input/output, sem chamadas duplicadas.

## Fora de escopo (só TODO)
DB, auth, RAG, vector DB, SIEM/SOAR, integrações enterprise, remediation, multi-provider, roteamento de modelos, fine-tuning.

## Comandos
- Backend: `cd backend && .venv/Scripts/python -m pytest` (offline); `-m live` usa a API real.
- Frontend: `npm run typecheck && npm run lint && npm run build`.

## Estado / pendências (atualizar só com decisões de valor futuro)
- F2 concluída: deps instaladas, pytest/typecheck/lint/build OK.
- Modelo: `gemini-3.5-flash-lite` com `GEMINI_THINKING_LEVEL=minimal`. Limites diários por IP e global em memória. Detalhes e pendências: `.ai/STATUS.md`.
- Git: sem commit/push automático.
