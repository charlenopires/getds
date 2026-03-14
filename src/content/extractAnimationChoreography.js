/**
 * Animation Choreography extraction — Gap 4: Motion as Choreography
 *
 * Classifies animations as ambient/interactive/scroll-driven,
 * detects hover choreography, stagger sequences, and state machines.
 *
 * @param {string[]} stylesheetTexts - Pre-collected CSS texts
 * @param {Array} animations - From extractCssAnimations()
 * @param {Array} transitions - From extractTransitions()
 * @returns {{ ambientAnimations, interactiveAnimations, scrollAnimations, hoverChoreography, staggerSequences, animationSequenceMap }}
 */

function parseDuration(dur) {
  if (!dur) return 0;
  const s = String(dur);
  if (s.endsWith('ms')) return parseFloat(s) || 0;
  if (s.endsWith('s')) return (parseFloat(s) || 0) * 1000;
  return parseFloat(s) || 0;
}

export function extractAnimationChoreography(stylesheetTexts = [], animations = [], transitions = []) {
  // A. Classify animations: ambient vs interactive vs scroll-driven
  const ambientAnimations = [];
  const interactiveAnimations = [];
  const scrollAnimations = [];

  // Collect interactive animation names from CSSOM :hover/:focus/:active rules
  const interactiveNames = new Set();
  const hoverAnimRe = /:(hover|focus|active)\s*\{[^}]*(animation-name|animation)\s*:\s*([^;}\s]+)/gi;
  for (const text of stylesheetTexts) {
    let match;
    while ((match = hoverAnimRe.exec(text)) !== null) {
      interactiveNames.add(match[3].trim());
    }
  }

  for (const anim of animations) {
    const name = anim.name ?? '';
    const iterCount = anim.iterationCount ?? '1';
    const duration = parseDuration(anim.duration);
    const timeline = anim.animationTimeline ?? '';

    if (timeline && /scroll|view/i.test(timeline)) {
      scrollAnimations.push({ name, timeline, element: anim.element, category: 'scroll-driven' });
    } else if (interactiveNames.has(name)) {
      interactiveAnimations.push({ name, trigger: 'hover/focus/active', element: anim.element, category: 'interactive' });
    } else if (iterCount === 'infinite' && duration > 2000) {
      ambientAnimations.push({ name, duration: anim.duration, element: anim.element, category: 'ambient' });
    } else {
      // Default: interactive if short, ambient if long
      if (duration > 5000) {
        ambientAnimations.push({ name, duration: anim.duration, element: anim.element, category: 'ambient' });
      } else {
        interactiveAnimations.push({ name, trigger: 'unknown', element: anim.element, category: 'interactive' });
      }
    }
  }

  // B. Hover choreography detection
  const hoverChoreography = [];
  const hoverChildRe = /([^\s,{}]+):hover\s+([^\s,{]+)\s*\{([^}]+)\}/g;
  for (const text of stylesheetTexts) {
    let match;
    while ((match = hoverChildRe.exec(text)) !== null) {
      const triggerSelector = match[1].trim();
      const childSelector = match[2].trim();
      const propsText = match[3].trim();

      // Parse properties
      const properties = {};
      const propPairs = propsText.split(';').filter(Boolean);
      for (const pair of propPairs) {
        const [prop, ...valParts] = pair.split(':');
        if (prop && valParts.length > 0) {
          properties[prop.trim()] = { to: valParts.join(':').trim() };
        }
      }

      // Find or create choreography group
      let group = hoverChoreography.find(h => h.triggerSelector === triggerSelector);
      if (!group) {
        group = { triggerSelector, affectedChildren: [] };
        hoverChoreography.push(group);
      }

      // Extract transition if present
      const transition = properties['transition']?.to ?? null;
      delete properties['transition'];

      if (Object.keys(properties).length > 0) {
        group.affectedChildren.push({
          selector: childSelector,
          properties,
          transition,
        });
      }
    }
  }

  // C. Stagger detection
  const staggerSequences = [];
  const animByName = {};
  for (const anim of animations) {
    const name = anim.name ?? '';
    if (!name) continue;
    if (!animByName[name]) animByName[name] = [];
    animByName[name].push(anim);
  }

  for (const [name, anims] of Object.entries(animByName)) {
    if (anims.length < 3) continue;

    // Sort by delay
    const sorted = [...anims].sort((a, b) => parseDuration(a.delay) - parseDuration(b.delay));
    const delays = sorted.map(a => parseDuration(a.delay));

    // Check for arithmetic sequence
    if (delays.length >= 3) {
      const increments = [];
      for (let i = 1; i < delays.length; i++) {
        increments.push(delays[i] - delays[i - 1]);
      }
      const avgIncrement = increments.reduce((a, b) => a + b, 0) / increments.length;
      const isConsistent = increments.every(inc => Math.abs(inc - avgIncrement) < 10);

      if (isConsistent && avgIncrement > 0) {
        staggerSequences.push({
          animationName: name,
          count: anims.length,
          staggerIncrement: `${Math.round(avgIncrement)}ms`,
          elements: sorted.map(a => a.element).filter(Boolean),
        });
      }
    }
  }

  // D. Animation sequence map (state machine for interactive elements)
  const animationSequenceMap = [];
  const stateRe = /([^\s,{}]+):(idle|hover|active|focus)\s*\{([^}]+)\}/g;
  const selectorStates = {};

  for (const text of stylesheetTexts) {
    let match;
    while ((match = stateRe.exec(text)) !== null) {
      const selector = match[1].trim();
      const state = match[2].trim();
      const propsText = match[3].trim();

      if (!selectorStates[selector]) selectorStates[selector] = {};

      const props = {};
      const propPairs = propsText.split(';').filter(Boolean);
      for (const pair of propPairs) {
        const [prop, ...valParts] = pair.split(':');
        if (prop && valParts.length > 0) {
          props[prop.trim()] = valParts.join(':').trim();
        }
      }

      selectorStates[selector][state] = props;
    }
  }

  // Only include selectors with multiple states
  for (const [selector, states] of Object.entries(selectorStates)) {
    if (Object.keys(states).length >= 2) {
      animationSequenceMap.push({ selector, states });
    }
  }

  return {
    ambientAnimations,
    interactiveAnimations,
    scrollAnimations,
    hoverChoreography,
    staggerSequences,
    animationSequenceMap,
  };
}
