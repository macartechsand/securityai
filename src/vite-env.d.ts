/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the backend (no trailing slash). Not a secret. Empty = same origin / dev proxy. */
  readonly VITE_API_BASE_URL?: string;
}
