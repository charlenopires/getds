/**
 * Alt text audit — Spec: 10ab6f26 — Accessibility Audit
 *
 * Checks all img elements for the presence of an alt attribute.
 * An empty alt="" is acceptable (marks image as decorative).
 * A missing alt attribute entirely is a critical accessibility violation.
 */

/**
 * @typedef {{ type: string, severity: string, message: string, src: string }} AltIssue
 */

/**
 * Audit a list of img elements for missing alt attributes.
 *
 * @param {HTMLImageElement[]} images
 * @returns {AltIssue[]}
 */
export function auditAltText(images) {
  const issues = [];

  for (const img of images) {
    if (!img.hasAttribute('alt')) {
      issues.push({
        type: 'missing-alt',
        severity: 'critical',
        message: `<img> is missing an alt attribute. Add alt="" for decorative images or a descriptive value for informative images.`,
        src: img.getAttribute('src') ?? img.src ?? '',
      });
    }
  }

  return issues;
}
