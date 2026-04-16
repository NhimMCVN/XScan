import dayjs from "dayjs";
import { detect } from "detect-browser";
import moment from "moment";

const capitalizeStr = (str: string) => str[0].toUpperCase() + str.slice(1);

export const getToastSuccess = (text: string) =>
  capitalizeStr(`${text?.toLowerCase()} successfully!`);

export const getToastError = (text: string) =>
  capitalizeStr(`${text?.toLowerCase()} failed!`);

const detectOS = () => {
  const browser = detect();
  return browser?.os ?? "";
};

const isIOS = () => {
  const os = detectOS();
  return os.toLowerCase().includes("ios");
};

const isAndroid = () => {
  const os = detectOS();
  return os.toLowerCase().includes("android");
};

export const isMobile = isAndroid() || isIOS();

export const appConfig = {
  formatDateTime: "Do MMM YYYY",
  formatTime: "Do MMM YYYY HH:mm:ss",
  formatDateTimeFull: "MM/DD/YYYY - HH:mm:ss",
};

export const formatDate = (time: any, format: string) => {
  if (!time) return "";
  // @ts-ignore
  const d = new moment.unix(time);
  return d.format(format ?? appConfig.formatDateTimeFull);
};

export const removeTrailingSlash = (url: string | undefined): string => {
  if (!url) return "";
  return url.replace(/\/+$/, "");
};

type TruncateMiddleOptions = {
  /** Số ký tự giữ ở đầu (mặc định 8) */
  headChars?: number;
  /** Số ký tự giữ ở cuối (mặc định 8) */
  tailChars?: number;
  /** Chuỗi ở giữa (mặc định "...") */
  ellipsis?: string;
};

/**
 * Rút gọn chuỗi dài dạng `abc12345…xyz67890` (giữ đầu + cuối).
 * Phù hợp hiển thị URL/token; thao tác copy vẫn nên dùng bản đầy đủ.
 */
export function truncateMiddle(
  str: string,
  options?: TruncateMiddleOptions,
): string {
  if (typeof str !== "string" || str.length === 0) return "";
  const head = options?.headChars ?? 8;
  const tail = options?.tailChars ?? 8;
  const ellipsis = options?.ellipsis ?? "...";
  const minLen = head + ellipsis.length + tail;
  if (str.length <= minLen) return str;
  return `${str.slice(0, head)}${ellipsis}${str.slice(-tail)}`;
}

export const checkCurrentTimezone = () => {
  const timezoneOffset = dayjs().utcOffset();
  const timezoneHours = timezoneOffset / 60;
  const timezoneString = `UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneHours}`;
  return timezoneString;
};
