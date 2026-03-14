// -- CSS Framework Detection --------------------------------------------------
// Inspired by dembrandt lib/extractors.js:detectFrameworks.

const STYLESHEET_PATTERNS = [
  { name: 'Bootstrap', pattern: /bootstrap/i },
  { name: 'Tailwind CSS', pattern: /tailwind/i },
  { name: 'Bulma', pattern: /bulma/i },
  { name: 'Foundation', pattern: /foundation/i },
  { name: 'Material UI', pattern: /material|mui/i },
  { name: 'Chakra UI', pattern: /chakra/i },
  { name: 'Ant Design', pattern: /antd|ant-design/i },
  { name: 'Semantic UI', pattern: /semantic/i },
];

const CLASS_PATTERNS = [
  {
    name: 'Bootstrap',
    patterns: [/^col-\w+-\d+$/, /^btn-\w+$/, /^container$/, /^row$/, /^navbar/],
    minMatches: 3,
  },
  {
    name: 'Tailwind CSS',
    patterns: [/^p-\d/, /^m-\d/, /^flex$/, /^grid$/, /^text-\w+-\d+$/, /^\[.+\]$/],
    minMatches: 4,
  },
  {
    name: 'Material UI',
    patterns: [/^Mui/, /^MuiButton/, /^MuiTypography/, /^css-\w+/],
    minMatches: 2,
  },
  {
    name: 'Chakra UI',
    patterns: [/^chakra-/],
    minMatches: 2,
  },
];

const FONT_SOURCES = [
  { provider: 'Google Fonts', pattern: /fonts\.googleapis\.com/ },
  { provider: 'Adobe Typekit', pattern: /use\.typekit\.net/ },
  { provider: 'Font Awesome', pattern: /fontawesome|fa-/ },
];

/**
 * Detect CSS frameworks and font sources used on the page.
 *
 * @returns {{ frameworks: Array<{name: string, confidence: number, signals: string[]}>,
 *             fontSources: Array<{provider: string, url: string}> }}
 */
export function detectCssFramework() {
  const frameworkMap = new Map();
  const fontSources = [];

  // 1. Check stylesheet URLs
  try {
    for (const sheet of document.styleSheets) {
      const href = sheet.href || '';
      for (const sp of STYLESHEET_PATTERNS) {
        if (sp.pattern.test(href)) {
          if (!frameworkMap.has(sp.name)) {
            frameworkMap.set(sp.name, { name: sp.name, confidence: 0, signals: [] });
          }
          const fw = frameworkMap.get(sp.name);
          fw.confidence += 40;
          fw.signals.push(`stylesheet: ${href.slice(0, 80)}`);
        }
      }
      for (const fs of FONT_SOURCES) {
        if (fs.pattern.test(href)) {
          fontSources.push({ provider: fs.provider, url: href });
        }
      }
    }
  } catch {
    // CORS may block stylesheet access
  }

  // Also check <link> elements directly (more reliable for cross-origin)
  try {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    for (const link of links) {
      const href = link.href || '';
      for (const fs of FONT_SOURCES) {
        if (fs.pattern.test(href) && !fontSources.some((s) => s.url === href)) {
          fontSources.push({ provider: fs.provider, url: href });
        }
      }
    }
  } catch {
    // ignore
  }

  // 2. Sample class patterns from first 200 elements
  try {
    const els = document.querySelectorAll('*');
    const limit = Math.min(els.length, 200);
    const classCounts = new Map();

    for (let i = 0; i < limit; i++) {
      const classList = els[i].classList;
      for (const cls of classList) {
        for (const cp of CLASS_PATTERNS) {
          for (const pat of cp.patterns) {
            if (pat.test(cls)) {
              const key = cp.name;
              if (!classCounts.has(key)) classCounts.set(key, new Set());
              classCounts.get(key).add(cls);
            }
          }
        }
      }
    }

    for (const [name, classes] of classCounts) {
      const cp = CLASS_PATTERNS.find((p) => p.name === name);
      if (classes.size >= (cp?.minMatches ?? 3)) {
        if (!frameworkMap.has(name)) {
          frameworkMap.set(name, { name, confidence: 0, signals: [] });
        }
        const fw = frameworkMap.get(name);
        fw.confidence += Math.min(classes.size * 5, 50);
        fw.signals.push(
          `classes: ${[...classes].slice(0, 5).join(', ')}${classes.size > 5 ? ` (+${classes.size - 5} more)` : ''}`
        );
      }
    }
  } catch {
    // ignore
  }

  // Cap confidence at 100
  const frameworks = [...frameworkMap.values()]
    .map((fw) => ({ ...fw, confidence: Math.min(fw.confidence, 100) }))
    .sort((a, b) => b.confidence - a.confidence);

  return { frameworks, fontSources };
}
