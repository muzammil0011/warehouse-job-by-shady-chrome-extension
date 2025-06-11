import consola from "consola";
const isDev = import.meta.env.DEV;

export const manifest = browser.runtime.getManifest();

export const formattedDateTime = new Date()
  .toISOString()
  .replace("T", " ")
  .slice(0, 19);

type LoggerMethods = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  success: (...args: any[]) => void;
  start: (...args: any[]) => void;
  ready: (...args: any[]) => void;
  box: (...args: any[]) => void;
  fatal: (...args: any[]) => void;
  trace: (...args: any[]) => void;
};

const baseLogger: Partial<LoggerMethods> =
  isDev && typeof consola !== "undefined" ? consola : console;

export const logger: LoggerMethods = new Proxy({} as LoggerMethods, {
  get(_, prop: keyof LoggerMethods) {
    if (prop in baseLogger && typeof baseLogger[prop] === "function") {
      return baseLogger[prop]!.bind(baseLogger);
    }

    // Fallback: unknown method → console.log with tag
    return (...args: any[]) => console.log(`[${prop}]`, ...args);
  },
});

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/\.+$/, "") // Remove trailing dots
    .substring(0, 250); // Limit filename length
}

/**
 * Checks if the current date is before the given D-M-YYYY date string.
 * @param dateStr - Must be in D-M-YYYY format (e.g., "1-1-2025" or "15-12-2026")
 * @returns boolean - true if now is before the date
 * @throws Error if format or date is invalid
 */
export function isBefore(dateStr: `${number}-${number}-${number}`): boolean {
  const regex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  const match = dateStr.match(regex);

  if (!match) {
    throw new Error("Invalid date format. Use D-M-YYYY (e.g. 1-1-2025)");
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  // Basic sanity check for real calendar values
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("Invalid date: out of range");
  }

  // Create a date using UTC to avoid timezone discrepancies
  const inputDate = new Date(Date.UTC(year, month - 1, day));

  // Check if the created date matches (e.g., no Feb 30)
  if (
    inputDate.getUTCFullYear() !== year ||
    inputDate.getUTCMonth() + 1 !== month ||
    inputDate.getUTCDate() !== day
  ) {
    throw new Error("Invalid date: not a real calendar date");
  }

  return new Date() < inputDate;
}

//hex to rgba with opacity
export function hexToRgba(hex: string, opacity: number): string {
  // Expand shorthand form (#RGB to #RRGGBB)
  if (/^#([a-f\d])([a-f\d])([a-f\d])$/i.test(hex)) {
    hex = hex.replace(
      /^#([a-f\d])([a-f\d])([a-f\d])$/i,
      (_, r, g, b) => "#" + r + r + g + g + b + b,
    );
  }

  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) throw new Error("Invalid hex color");

  const [_, r, g, b] = match;
  return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(
    b,
    16,
  )}, ${opacity})`;
}

export const injectStyleToMainDom = (cssCode: string): HTMLStyleElement => {
  // Create a new <style> element
  const styleElement = document.createElement("style");

  // Set the CSS code as the content of the style element
  styleElement.textContent = cssCode;

  // Append the style element to the document's <head>
  document.head.appendChild(styleElement);

  // Return the created style element (optional)
  return styleElement;
};

export function getRuleBySelector(selector: string): CSSStyleRule | null {
  let matchedRule: CSSStyleRule | null = null;

  const styleSheets = document.styleSheets;

  for (let i = 0; i < styleSheets.length; i++) {
    const sheet = styleSheets[i];
    const rules = sheet.cssRules || [];

    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j];

      // Type guard: Check if the rule is a CSSStyleRule
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
        matchedRule = rule;
        break;
      }
    }
  }

  return matchedRule;
}
