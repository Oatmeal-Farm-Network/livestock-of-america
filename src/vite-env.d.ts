/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVESTOCK_API_URL: string;
  readonly VITE_NEWS_API_URL?: string;
  readonly VITE_SAIGE_API_URL?: string;
  readonly VITE_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
