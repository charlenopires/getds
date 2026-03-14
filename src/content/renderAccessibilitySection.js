/**
 * Accessibility section renderer — Layer 7
 *
 * Produces detailed, human-readable Markdown for:
 *   - A11y score with grade
 *   - WCAG conformance overview
 *   - Issues grouped by category and severity
 *   - Heading hierarchy visualization
 *   - Actionable recommendations
 */

// ---------------------------------------------------------------------------
// Score rendering
// ---------------------------------------------------------------------------

function scoreGrade(score) {
  if (score >= 95) return { grade: 'A+', label: 'Excellent', emoji: '🟢' };
  if (score >= 85) return { grade: 'A',  label: 'Good',      emoji: '🟢' };
  if (score >= 70) return { grade: 'B',  label: 'Fair',      emoji: '🟡' };
  if (score >= 50) return { grade: 'C',  label: 'Poor',      emoji: '🟠' };
  return                 { grade: 'D',  label: 'Critical',   emoji: '🔴' };
}

function renderScore(score) {
  const s = typeof score === 'number' ? score : 0;
  const { grade, label, emoji } = scoreGrade(s);
  const bar = buildProgressBar(s);
  return (
    `${emoji} **Score: ${s}/100** — ${label} (Grade ${grade})\n\n` +
    `\`${bar}\``
  );
}

function buildProgressBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled) + ` ${score}%`;
}

// ---------------------------------------------------------------------------
// Issues rendering
// ---------------------------------------------------------------------------

const CATEGORY_LABELS = {
  'alt-text': '🖼️ Missing Alt Text',
  'aria':     '🏷️ ARIA Issues',
  'headings': '📑 Heading Hierarchy',
  'focus':    '🎯 Focus Indicators',
  'contrast': '🌈 Color Contrast',
};

const SEVERITY_EMOJI = {
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

function renderIssuesByCategory(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return '✅ **No accessibility issues detected.** Great work!';
  }

  // Group by category
  const groups = {};
  for (const issue of issues) {
    const cat = issue.category ?? 'other';
    if (!groups[cat]) groups[cat] = { errors: [], warnings: [], info: [] };
    const severity = issue.severity ?? 'error';
    const bucket   = severity === 'error' ? 'errors' : severity === 'warning' ? 'warnings' : 'info';
    groups[cat][bucket].push(issue);
  }

  const sections = [];

  for (const [cat, group] of Object.entries(groups)) {
    const label = CATEGORY_LABELS[cat] ?? `🔍 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
    const allIssues = [...group.errors, ...group.warnings, ...group.info];

    const rows = allIssues.slice(0, 20).map(issue => {
      const sev     = issue.severity ?? 'error';
      const icon    = SEVERITY_EMOJI[sev] ?? '⚠️';
      const element = issue.tag ?? issue.element ?? issue.selector ?? '—';
      const detail  = issue.issue ?? issue.message ?? issue.description ?? '—';
      return `| ${icon} ${sev} | \`${element}\` | ${detail} |`;
    });

    const more = allIssues.length > 20 ? `\n\n_...and ${allIssues.length - 20} more_` : '';

    sections.push(
      `#### ${label}\n\n` +
      `**${group.errors.length} errors, ${group.warnings.length} warnings**\n\n` +
      '| Severity | Element | Issue |\n' +
      '|----------|---------|-------|\n' +
      rows.join('\n') +
      more
    );
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Heading hierarchy
// ---------------------------------------------------------------------------

function renderHeadingHierarchy(headingLevels) {
  if (!Array.isArray(headingLevels) || headingLevels.length === 0) {
    return '_No headings detected._';
  }

  // Count by level
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const level of headingLevels) {
    if (level >= 1 && level <= 6) counts[level]++;
  }

  const rows = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => {
      const indent = '  '.repeat(parseInt(level) - 1);
      return `| h${level} | ${count} | ${indent}${'─'.repeat(parseInt(level))} |`;
    });

  // Detect skipped levels
  const usedLevels = Object.entries(counts)
    .filter(([, c]) => c > 0)
    .map(([l]) => parseInt(l))
    .sort((a, b) => a - b);

  const skipped = [];
  for (let i = 1; i < usedLevels.length; i++) {
    if (usedLevels[i] - usedLevels[i - 1] > 1) {
      for (let l = usedLevels[i - 1] + 1; l < usedLevels[i]; l++) {
        skipped.push(`h${l}`);
      }
    }
  }

  const warnings = [
    counts[1] === 0 ? '⚠️ No `<h1>` found — page lacks a primary heading' : null,
    counts[1] > 1   ? `⚠️ Multiple \`<h1>\` found (${counts[1]}) — should be exactly one` : null,
    skipped.length > 0 ? `⚠️ Heading levels skipped: ${skipped.join(', ')}` : null,
  ].filter(Boolean);

  const parts = [
    '| Level | Count | Hierarchy |\n|-------|-------|----------|\n' + rows.join('\n'),
  ];

  if (warnings.length > 0) {
    parts.push(warnings.join('\n'));
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// WCAG Conformance overview
// ---------------------------------------------------------------------------

function renderWcagOverview(issues) {
  const allIssues = Array.isArray(issues) ? issues : [];
  const errors   = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity !== 'error').length;

  const categories = {
    altText:  allIssues.filter(i => i.category === 'alt-text').length,
    aria:     allIssues.filter(i => i.category === 'aria').length,
    headings: allIssues.filter(i => i.category === 'headings').length,
    focus:    allIssues.filter(i => i.category === 'focus').length,
    contrast: allIssues.filter(i => i.category === 'contrast').length,
  };

  const conformanceLevel =
    errors === 0 && warnings === 0 ? 'AA ✅' :
    errors === 0                    ? 'Partial AA ⚠️' :
                                      'Non-conformant ❌';

  return (
    '| Metric | Value |\n' +
    '|--------|-------|\n' +
    `| WCAG 2.2 conformance | ${conformanceLevel} |\n` +
    `| Critical errors | ${errors} |\n` +
    `| Warnings | ${warnings} |\n` +
    `| Alt text issues | ${categories.altText} |\n` +
    `| ARIA issues | ${categories.aria} |\n` +
    `| Heading issues | ${categories.headings} |\n` +
    `| Focus indicator issues | ${categories.focus} |\n` +
    `| Contrast issues | ${categories.contrast} |`
  );
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

function renderRecommendations(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    return '✅ No recommendations — accessibility looks great!';
  }

  const recs = [];

  const hasAltText = issues.some(i => i.category === 'alt-text');
  const hasFocus   = issues.some(i => i.category === 'focus');
  const hasAria    = issues.some(i => i.category === 'aria');
  const hasHeadings = issues.some(i => i.category === 'headings');

  if (hasAltText) {
    recs.push('1. **Add descriptive `alt` text** to all informational images. Use `alt=""` for decorative images.');
  }
  if (hasFocus) {
    recs.push('2. **Add visible focus indicators** (`:focus-visible`) to all interactive elements. Minimum 3:1 contrast ratio for focus ring.');
  }
  if (hasAria) {
    recs.push('3. **Review ARIA usage** — ensure roles, states and properties match the HTML semantics. Prefer native HTML elements over ARIA where possible.');
  }
  if (hasHeadings) {
    recs.push('4. **Fix heading hierarchy** — use exactly one `<h1>` and do not skip levels (e.g., h2 → h4).');
  }
  recs.push(`${recs.length + 1}. **Integrate axe-core** into CI/CD to catch regressions automatically.`);
  recs.push(`${recs.length + 1}. **Test with screen readers** (NVDA + Chrome, VoiceOver + Safari) to verify the experience beyond automated checks.`);

  return recs.join('\n');
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the Accessibility layer as rich Markdown.
 *
 * @param {object} data - Accessibility layer payload
 * @returns {string}
 */
export function renderAccessibilitySection(data = {}) {
  const { issues, score, headingLevels } = data;

  const parts = [];

  // Score
  parts.push('### Score\n\n' + renderScore(score));

  // WCAG overview
  parts.push('### WCAG 2.2 Conformance Overview\n\n' + renderWcagOverview(issues));

  // Issues by category
  parts.push('### Issues\n\n' + renderIssuesByCategory(issues));

  // Heading hierarchy
  parts.push('### Heading Hierarchy\n\n' + renderHeadingHierarchy(headingLevels));

  // Recommendations
  parts.push('### Recommendations\n\n' + renderRecommendations(issues));

  return parts.join('\n\n');
}
