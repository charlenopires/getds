/**
 * Layout type classification — Layout Analysis
 * Classifies the page layout type based on structural signals.
 */

const LAYOUT_TYPES = [
  { type: 'Dashboard', signals: ['aside', 'nav', 'main', 'grid'], minSignals: 3 },
  { type: 'Settings', signals: ['form', 'nav', 'aside'], minSignals: 2, requiredSignals: ['form'] },
  { type: 'Job:Wizard', signals: ['form', 'steps', 'progress'], minSignals: 2 },
  { type: 'Resource:Details', signals: ['main', 'aside', 'article'], minSignals: 2, requiredSignals: ['article'] },
  { type: 'Resource', signals: ['main', 'table', 'grid', 'list'], minSignals: 2 },
  { type: 'Content', signals: ['article', 'main', 'header', 'footer'], minSignals: 2, requiredSignals: ['article'] },
];

/**
 * Classify the page layout type from structural signals.
 * @param {{ landmarks: string[], hasForm: boolean, hasTable: boolean, hasGrid: boolean, hasList: boolean, hasSteps: boolean, hasProgress: boolean }} signals
 * @returns {{ layoutType: string, confidence: number, description: string }}
 */
export function classifyLayoutType(signals) {
  const allSignals = new Set([
    ...(signals.landmarks ?? []).map(l => l.toLowerCase()),
    ...(signals.hasForm ? ['form'] : []),
    ...(signals.hasTable ? ['table'] : []),
    ...(signals.hasGrid ? ['grid'] : []),
    ...(signals.hasList ? ['list'] : []),
    ...(signals.hasSteps ? ['steps'] : []),
    ...(signals.hasProgress ? ['progress'] : []),
  ]);

  let bestMatch = null;
  let bestScore = 0;

  for (const lt of LAYOUT_TYPES) {
    if (lt.requiredSignals && !lt.requiredSignals.every(s => allSignals.has(s))) continue;

    const matched = lt.signals.filter(s => allSignals.has(s)).length;
    if (matched < lt.minSignals) continue;

    const score = matched / lt.signals.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = lt;
    }
  }

  if (!bestMatch) {
    return { layoutType: 'Content', confidence: 0.3, description: 'Generic content page' };
  }

  const descriptions = {
    'Dashboard': 'Multi-panel dashboard with navigation and data views',
    'Settings': 'Settings or configuration page with forms',
    'Job:Wizard': 'Multi-step wizard or job creation flow',
    'Resource:Details': 'Resource detail view with sidebar',
    'Resource': 'Resource listing or data table view',
    'Content': 'Content-focused page with article layout',
  };

  return {
    layoutType: bestMatch.type,
    confidence: Math.round(bestScore * 100) / 100,
    description: descriptions[bestMatch.type] ?? bestMatch.type,
  };
}
