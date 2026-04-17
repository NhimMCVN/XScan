/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL: string;
  /** Origin trang web (vd. https://app.xscan.top) — dùng cho link xem widget alert; không set thì dùng window.location.origin */
  readonly VITE_PUBLIC_APP_ORIGIN?: string;
  readonly VITE_PUBLIC_ENV: string;
  readonly VITE_VNPT_BACKEND_URL: string;
  readonly VITE_VNPT_TOKEN_KEY: string;
  readonly VITE_VNPT_TOKEN_ID: string;
  readonly VITE_VNPT_AUTHORIZATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
