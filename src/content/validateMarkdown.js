/**
 * Markdown structural validator — Spec: b0d5a227 — Markdown Report Generation
 *
 * Checks for common structural issues that would cause rendering problems in
 * GitHub, VS Code preview, and common Markdown viewers:
 *   - Unclosed fenced code blocks
 *   - YAML frontmatter not at document start
 *   - GFM tables with inconsistent column counts
 */

/**
 * Count the pipe-delimited columns in a GFM table row.
 * Strips leading/trailing pipes before counting.
 *
 * @param {string} line
 * @returns {number}
 */
function countColumns(line) {
  return line.replace(/^\||\|$/g, '').split('|').length;
}

/**
 * Returns true if a line looks like a GFM table separator row (|---|---|).
 *
 * @param {string} line
 * @returns {boolean}
 */
function isSeparator(line) {
  return /^\|?[\s|:-]+\|$/.test(line.trim());
}

/**
 * Validate Markdown for structural correctness.
 *
 * @param {string} markdown
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMarkdown(markdown) {
  const errors = [];
  if (!markdown) return { valid: true, errors };

  const lines = markdown.split('\n');

  // ── 1. Fenced code block balance ─────────────────────────────────────────
  let fenceDepth = 0;
  for (const line of lines) {
    if (/^```/.test(line)) {
      fenceDepth += fenceDepth === 0 ? 1 : -1;
    }
  }
  if (fenceDepth !== 0) {
    errors.push('Fenced code block is not closed (unbalanced ``` markers)');
  }

  // ── 2. YAML frontmatter position ─────────────────────────────────────────
  // Frontmatter is valid only when the document starts with ---
  // If we find --- later in the document (not inside a fence), flag it.
  let inFence = false;
  let foundFrontmatterStart = false;
  let frontmatterValid = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (line.trim() === '---') {
      if (i === 0) {
        foundFrontmatterStart = true;
        continue;
      }
      // A --- not at position 0 and not closing a valid frontmatter is suspicious
      if (!foundFrontmatterStart) {
        frontmatterValid = false;
      } else {
        // This closes the frontmatter — mark as handled
        foundFrontmatterStart = false;
      }
    }
  }

  if (!frontmatterValid) {
    errors.push('YAML frontmatter (---) found outside the document start position');
  }

  // ── 3. GFM table column consistency ──────────────────────────────────────
  inFence = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      inFence = !inFence;
      i++;
      continue;
    }
    if (inFence) { i++; continue; }

    // Detect start of a GFM table: a pipe line followed by a separator line
    if (line.includes('|') && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const headerCols = countColumns(line);
      const sepCols    = countColumns(lines[i + 1]);

      if (headerCols !== sepCols) {
        errors.push(
          `GFM table column mismatch: header has ${headerCols} column(s), separator has ${sepCols}`
        );
        i += 2;
        continue;
      }

      // Check all subsequent data rows
      let j = i + 2;
      while (j < lines.length && lines[j].includes('|')) {
        const rowCols = countColumns(lines[j]);
        if (rowCols !== headerCols) {
          errors.push(
            `GFM table column mismatch: header has ${headerCols} column(s), row ${j + 1} has ${rowCols}`
          );
        }
        j++;
      }
      i = j;
      continue;
    }

    i++;
  }

  return { valid: errors.length === 0, errors };
}
