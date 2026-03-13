/**
 * Animation categorization — Spec: 1bd1426a — Motion and Animation Extraction
 *
 * Categorizes an animation descriptor into one of:
 * continuous, loading, entrance, exit, micro-interaction, page-transition, scroll-triggered
  * 
 * @example
 * // Usage of categorizeAnimation
*/

const LOADING_RE  = /\b(spin|pulse|skeleton|shimmer|loader|loading)\b/i;
const ENTRANCE_RE = /\b(fade-?in|slide-?in|bounce-?in|zoom-?in|appear|enter|show)\b/i;
const EXIT_RE     = /\b(fade-?out|slide-?out|bounce-?out|zoom-?out|disappear|leave|hide)\b/i;
const PAGE_RE     = /\b(page|route|transition)\b/i;
const SCROLL_RE   = /\b(scroll|reveal|parallax|observer)\b/i;

const MICRO_INTERACTION_COMPONENTS = new Set(['button', 'input', 'nav']);

/**
 * Categorize an animation descriptor.
 *
 * @param {{
 *   name: string,
 *   iterationCount: string | number,
 *   componentType?: string
 * }} descriptor
 * @returns {'continuous' | 'loading' | 'entrance' | 'exit' | 'micro-interaction' | 'page-transition' | 'scroll-triggered'}
 */
export function categorizeAnimation({ name = '', iterationCount = '1', componentType = 'unknown' }) {
  const iter = String(iterationCount);

  // 1. Infinite → continuous
  if (iter === 'infinite' || iterationCount === Infinity) return 'continuous';

  const n = name.toLowerCase();

  // 2. Loading patterns
  if (LOADING_RE.test(n)) return 'loading';

  // 3. Entrance patterns
  if (ENTRANCE_RE.test(n)) return 'entrance';

  // 4. Exit patterns
  if (EXIT_RE.test(n)) return 'exit';

  // 5. Page transition patterns
  if (PAGE_RE.test(n)) return 'page-transition';

  // 6. Scroll-triggered patterns
  if (SCROLL_RE.test(n)) return 'scroll-triggered';

  // 7. Interactive component → micro-interaction (default for buttons, inputs, etc.)
  if (MICRO_INTERACTION_COMPONENTS.has(componentType)) return 'micro-interaction';

  // 8. Default fallback
  return 'micro-interaction';
}
