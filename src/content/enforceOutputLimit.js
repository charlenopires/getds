/**
 * Output size enforcement — Spec: b0d5a227 — Markdown Report Generation
 *
 * Keeps the total Markdown output under 5 MiB.
 * If the serialised byte length exceeds the limit the output is truncated
 * at a safe UTF-8 boundary and a truncation notice is appended.
 */

/** Maximum allowed output size in bytes (5 MiB). */
export const MAX_BYTES = 5 * 1024 * 1024;

const TRUNCATION_NOTICE =
  '\n\n> **[Truncated]** Output exceeded the 5 MiB limit and was cut short.';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: false });

/**
 * Truncate a UTF-8 string to at most `maxBytes` bytes without splitting
 * multibyte code points, then append a truncation notice.
 *
 * @param {string} str
 * @param {number} maxBytes
 * @returns {string}
 */
function truncateToBytes(str, maxBytes) {
  const noticeBytes = encoder.encode(TRUNCATION_NOTICE).length;
  const contentBudget = maxBytes - noticeBytes;

  // If even the notice alone exceeds maxBytes, just slice the notice itself
  if (contentBudget <= 0) {
    return decoder.decode(encoder.encode(TRUNCATION_NOTICE).slice(0, maxBytes));
  }

  // Encode the full string and slice at the byte budget
  const full   = encoder.encode(str);
  const sliced = full.slice(0, contentBudget);

  // Decode back; the `fatal: false` decoder replaces partial sequences with
  // U+FFFD — scan backwards to strip any trailing replacement character.
  let text = decoder.decode(sliced);

  // Remove any trailing replacement character introduced by a split sequence
  text = text.replace(/\uFFFD+$/, '');

  return text + TRUNCATION_NOTICE;
}

/**
 * Enforce a maximum byte size on the Markdown output string.
 *
 * Returns the original string unchanged when it is within the limit.
 * Truncates and appends a notice when it exceeds the limit.
 *
 * @param {string} markdown
 * @param {number} [maxBytes=MAX_BYTES]
 * @returns {string}
 */
export function enforceOutputLimit(markdown, maxBytes = MAX_BYTES) {
  if (!markdown) return markdown;

  const byteLength = encoder.encode(markdown).length;
  if (byteLength <= maxBytes) return markdown;

  return truncateToBytes(markdown, maxBytes);
}
