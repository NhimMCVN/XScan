import { removeTrailingSlash } from "../utils/common";

/** Vite chỉ expose biến `VITE_*` qua `import.meta.env`, không qua `process.env`. */
export const API_URL = removeTrailingSlash(import.meta.env.VITE_PUBLIC_API_URL);

export const ENV = {
  DEV: "dev",
  PROD: "prod",
};

export const RESPONSE_STATUS = {
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
};

export const DEFAULT_PAGE_SIZE = 10;

export const IMAGE_ALT = "image";

export const MAX_SAFE_INTEGER = 9007199254740991;
