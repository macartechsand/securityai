import type { ChatRequest, ChatResponse } from '../types';

/**
 * The browser only ever talks to our own backend. No model provider is called from here and
 * no secret exists in the frontend. VITE_API_BASE_URL is a public URL, not a credential.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

const REQUEST_TIMEOUT_MS = 35_000;

export type ChatErrorKind =
  | 'rate_limited'
  | 'daily_limit_user'
  | 'daily_limit_global'
  | 'invalid'
  | 'unavailable'
  | 'timeout'
  | 'network';

export class ChatApiError extends Error {
  kind: ChatErrorKind;
  retryAfterSeconds?: number;

  constructor(kind: ChatErrorKind, retryAfterSeconds?: number) {
    super(kind);
    this.name = 'ChatApiError';
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function sendChat(payload: ChatRequest): Promise<ChatResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ChatApiError('timeout');
    }
    throw new ChatApiError('network');
  } finally {
    clearTimeout(timer);
  }

  if (response.ok) {
    const data: unknown = await response.json().catch(() => null);
    if (isChatResponse(data)) return data;
    throw new ChatApiError('unavailable');
  }

  if (response.status === 429) {
    const retry = Number.parseInt(response.headers.get('Retry-After') ?? '', 10);
    const body: unknown = await response.json().catch(() => null);
    const code = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).code : undefined;
    const kind: ChatErrorKind =
      code === 'daily_limit_user' || code === 'daily_limit_global' ? code : 'rate_limited';
    throw new ChatApiError(kind, Number.isFinite(retry) ? retry : undefined);
  }
  if (response.status === 413 || response.status === 422) throw new ChatApiError('invalid');
  if (response.status === 504) throw new ChatApiError('timeout');
  throw new ChatApiError('unavailable');
}

function isChatResponse(value: unknown): value is ChatResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.answer === 'string' &&
    (v.mode === 'simple' || v.mode === 'technical') &&
    Array.isArray(v.warnings)
  );
}
