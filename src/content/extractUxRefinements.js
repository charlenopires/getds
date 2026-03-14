/**
 * UX Refinements extraction — Gap 6: Micro-Details
 *
 * Captures scroll behavior, scroll-snap, custom cursors,
 * focus-visible styles, touch-action, and overscroll behavior.
 *
 * @param {string[]} stylesheetTexts - Pre-collected CSS texts
 * @returns {{ customCursors, scrollBehavior, scrollSnap, overscrollBehavior, scrollPaddingTop, focusVisibleStyles, touchAction }}
 */

function buildSelector(el) {
  const tag = el.tagName?.toLowerCase() ?? 'div';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList?.length > 0 ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  return `${tag}${id}${cls}`;
}

export function extractUxRefinements(stylesheetTexts = []) {
  // Custom cursors
  const customCursors = [];
  const seenCursors = new Set();
  const allElements = document.getElementsByTagName('*');
  for (const el of Array.from(allElements).slice(0, 500)) {
    try {
      const cursor = getComputedStyle(el).getPropertyValue('cursor').trim();
      if (cursor && cursor.includes('url(') && !seenCursors.has(cursor)) {
        seenCursors.add(cursor);
        customCursors.push({ type: 'css-url', value: cursor, selector: buildSelector(el) });
      }
    } catch { continue; }
  }

  // Check for cursor: none (JS-driven cursor replacement)
  for (const el of Array.from(allElements).slice(0, 500)) {
    try {
      const cursor = getComputedStyle(el).getPropertyValue('cursor').trim();
      if (cursor === 'none') {
        customCursors.push({ type: 'js-wrapper', value: 'none', selector: buildSelector(el) });
        break; // Only need to detect once
      }
    } catch { continue; }
  }

  // DOM elements with cursor-related class/id
  for (const el of Array.from(allElements).slice(0, 500)) {
    const cls = (el.className ?? '').toString().toLowerCase();
    const id = (el.id ?? '').toLowerCase();
    if (cls.includes('cursor') || id.includes('cursor')) {
      customCursors.push({ type: 'js-wrapper', value: buildSelector(el), selector: buildSelector(el) });
    }
  }

  // Scroll behavior
  const htmlStyle = getComputedStyle(document.documentElement);
  const bodyStyle = document.body ? getComputedStyle(document.body) : null;
  const scrollBehavior = {
    html: htmlStyle.getPropertyValue('scroll-behavior').trim() || 'auto',
    body: bodyStyle?.getPropertyValue('scroll-behavior').trim() || 'auto',
  };

  // Scroll snap
  const scrollSnap = [];
  const containers = document.getElementsByTagName('*');
  for (const el of Array.from(containers).slice(0, 500)) {
    try {
      const cs = getComputedStyle(el);
      const snapType = cs.getPropertyValue('scroll-snap-type').trim();
      if (snapType && snapType !== 'none') {
        const children = el.querySelectorAll('*');
        let snapAlign = 'none';
        for (const child of Array.from(children).slice(0, 20)) {
          const childSnap = getComputedStyle(child).getPropertyValue('scroll-snap-align').trim();
          if (childSnap && childSnap !== 'none') {
            snapAlign = childSnap;
            break;
          }
        }
        scrollSnap.push({ selector: buildSelector(el), type: snapType, align: snapAlign });
      }
    } catch { continue; }
  }

  // Overscroll behavior
  const overscrollBehavior = {
    x: htmlStyle.getPropertyValue('overscroll-behavior-x').trim() || 'auto',
    y: htmlStyle.getPropertyValue('overscroll-behavior-y').trim() || 'auto',
  };

  // Scroll padding top (fixed header offset)
  const scrollPaddingTop = htmlStyle.getPropertyValue('scroll-padding-top').trim() || null;

  // Focus-visible styles from CSSOM
  const focusVisibleStyles = [];
  const focusVisibleRe = /:focus-visible\s*\{([^}]+)\}/g;
  for (const text of stylesheetTexts) {
    let match;
    while ((match = focusVisibleRe.exec(text)) !== null) {
      const fullMatch = text.slice(Math.max(0, match.index - 100), match.index + match[0].length);
      const selectorMatch = fullMatch.match(/([^{}]+):focus-visible/);
      const selector = selectorMatch ? selectorMatch[1].trim() : '*';
      const styles = match[1].trim();
      focusVisibleStyles.push({ selector, styles });
    }
  }

  // Touch-action patterns
  const touchAction = [];
  const seenTouch = new Set();
  const interactiveEls = Array.from(document.getElementsByTagName('*')).filter(el => {
    const tag = el.tagName?.toLowerCase() ?? '';
    return ['a', 'button', 'input', 'canvas'].includes(tag) ||
      el.getAttribute('role') === 'button' ||
      el.getAttribute('draggable') === 'true';
  });
  for (const el of Array.from(interactiveEls).slice(0, 200)) {
    try {
      const ta = getComputedStyle(el).getPropertyValue('touch-action').trim();
      if (ta && ta !== 'auto') {
        const key = `${ta}|${el.tagName}`;
        if (!seenTouch.has(key)) {
          seenTouch.add(key);
          touchAction.push({ selector: buildSelector(el), value: ta });
        }
      }
    } catch { continue; }
  }

  return {
    customCursors,
    scrollBehavior,
    scrollSnap,
    overscrollBehavior,
    scrollPaddingTop,
    focusVisibleStyles,
    touchAction,
  };
}
