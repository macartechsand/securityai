import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Send, Shield, ShieldAlert } from 'lucide-react';
import ModeToggle from './ModeToggle';
import MessageContent from './MessageContent';
import { ChatApiError, sendChat } from '../services/chatApi';
import { useLanguage } from '../contexts/LanguageContext';
import type { ChatMessage, Mode } from '../types';

// Keep these in line with the backend defaults (MAX_MESSAGE_CHARS, MAX_HISTORY_*).
const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_ITEM_CHARS = 6000;

const MODE_STORAGE_KEY = 'macartech.mode';
const SUGGESTION_KEYS = ['chat.suggestion.1', 'chat.suggestion.2', 'chat.suggestion.3', 'chat.suggestion.4'];

function loadInitialMode(): Mode {
  try {
    return localStorage.getItem(MODE_STORAGE_KEY) === 'technical' ? 'technical' : 'simple';
  } catch {
    return 'simple';
  }
}

const Chat: React.FC = () => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>(loadInitialMode);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const idCounter = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nextId = () => `m${++idCounter.current}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const changeMode = (value: Mode) => {
    // Switching mode keeps the conversation; the next answer uses the new mode.
    setMode(value);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, value);
    } catch {
      /* storage unavailable: the choice just lasts for this session */
    }
  };

  const errorText = (error: unknown): string => {
    if (error instanceof ChatApiError) {
      const base = t(`chat.error.${error.kind}`);
      if (error.kind === 'rate_limited' && error.retryAfterSeconds) return `${base} (${error.retryAfterSeconds}s)`;
      if (error.kind.startsWith('daily_limit') && error.retryAfterSeconds) {
        const hours = Math.max(1, Math.ceil(error.retryAfterSeconds / 3600));
        return `${base} ${t('chat.limit.resetIn').replace('{hours}', String(hours))}`;
      }
      return base;
    }
    return t('chat.error.unavailable');
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || isLoading) return;

    const history = messages
      .filter((m) => !m.isError)
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_ITEM_CHARS) }));

    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await sendChat({ message: text, mode, history });
      if (typeof result.remaining_today === 'number') setRemainingToday(result.remaining_today);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: result.answer, warnings: result.warnings },
      ]);
    } catch (error) {
      if (error instanceof ChatApiError && error.kind === 'daily_limit_user') setRemainingToday(0);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: errorText(error), isError: true },
      ]);
      setInput((current) => current || text); // make it easy to resend
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  const reset = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-7 h-7 text-blue-700 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('chat.title')}</h2>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={messages.length === 0 || isLoading}
            className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('chat.new')}</span>
          </button>
        </div>

        <ModeToggle mode={mode} onChange={changeMode} />

        <div
          role="note"
          className="flex items-start space-x-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200"
        >
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p>{t('chat.notice')}</p>
        </div>

        <div
          role="log"
          aria-live="polite"
          className="min-h-[14rem] max-h-[28rem] overflow-y-auto space-y-4 pr-1"
        >
          {messages.length === 0 && !isLoading && (
            <div className="py-6 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-4">{t('chat.empty.title')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => void send(t(key))}
                    className="p-3 text-left text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className="max-w-[90%] space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUser ? t('chat.you') : t('chat.assistant')}
                  </p>
                  <div
                    role={message.isError ? 'alert' : undefined}
                    className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white whitespace-pre-wrap break-words'
                        : message.isError
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {isUser || message.isError ? message.content : <MessageContent text={message.content} />}
                  </div>
                  {message.warnings?.includes('truncated') && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('chat.warning.truncated')}</p>
                  )}
                  {message.warnings?.includes('secret_detected') && (
                    <div className="flex items-start space-x-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-3 text-xs text-amber-900 dark:text-amber-200">
                      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p>{t('chat.warning.secret')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-4 py-3 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 animate-pulse">
                {t('chat.thinking')}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            maxLength={MAX_MESSAGE_CHARS}
            placeholder={t('chat.placeholder')}
            aria-label={t('chat.placeholder')}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {input.length}/{MAX_MESSAGE_CHARS}
              {remainingToday !== null && ` · ${t('chat.limit.remaining').replace('{count}', String(remainingToday))}`}
            </span>
            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{t('chat.send')}</span>
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-400">{t('chat.disclaimer')}</p>
      </div>
    </div>
  );
};

export default Chat;
