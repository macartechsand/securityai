export type Mode = 'simple' | 'technical';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** Machine-readable notices from the API, e.g. "secret_detected". */
  warnings?: string[];
  /** True for locally generated error bubbles; never sent back as history. */
  isError?: boolean;
};

export type ChatHistoryItem = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  message: string;
  mode: Mode;
  history: ChatHistoryItem[];
};

export type ChatResponse = {
  answer: string;
  mode: Mode;
  warnings: string[];
};
