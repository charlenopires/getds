/**
 * Element Crawler — Persistent content script
 *
 * Injected into every page via manifest.json content_scripts.
 * Tracks the last right-clicked DOM element and shows an extraction
 * modal when the background sends SHOW_ELEMENT_CRAWLER.
 *
 * Entirely self-contained (no imports). Uses Shadow DOM to isolate styles.
 *
 * Features:
 * - DevTools-like inspect mode: hover-and-click element picker
 * - Markdown append by URL: same-URL crawls accumulate in one record
 */

(function () {
  'use strict';

  // Guard against double-injection
  if (window.__GETDS_CRAWLER_INIT__) return;
  window.__GETDS_CRAWLER_INIT__ = true;

  /** @type {Element|null} */
  let lastTarget = null;

  // ── Track right-clicked element ──────────────────────────────────────────
  document.addEventListener('contextmenu', (e) => {
    lastTarget = e.target;
  }, true);

  // ── Listen for message from background ──────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'SHOW_ELEMENT_CRAWLER') return;

    activateInspectMode();
    sendResponse({ ok: true });
    return true;
  });

  // ── Utilities ────────────────────────────────────────────────────────────

  /**
   * Builds a readable CSS selector path for an element (max 4 ancestors).
   * Stops at an element with an ID.
   */
  function buildSelector(el) {
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        part = '#' + cur.id;
        parts.unshift(part);
        break;
      }
      if (cur.classList.length) {
        const cls = Array.from(cur.classList)
          .filter(c => /^[\w-]+$/.test(c))
          .slice(0, 3)
          .join('.');
        if (cls) part += '.' + cls;
      }
      parts.unshift(part);
      cur = cur.parentElement;
      if (parts.length >= 4) break;
    }
    return parts.join(' > ') || el.tagName.toLowerCase();
  }

  /**
   * Extracts CSS rules from all stylesheets that match the element,
   * plus inline styles and a key subset of computed styles.
   */
  function extractCSS(el) {
    const selector = buildSelector(el);
    const matched  = [];

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (!rule.selectorText) continue;
          try {
            if (el.matches(rule.selectorText)) matched.push(rule.cssText);
          } catch { /* invalid selector */ }
        }
      } catch { /* CORS-blocked sheet */ }
    }

    if (el.getAttribute('style')) {
      matched.unshift(`/* inline */\n${selector} { ${el.getAttribute('style')} }`);
    }

    const cs   = getComputedStyle(el);
    const keys = [
      'display', 'position', 'width', 'height', 'min-width', 'min-height',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'background-color', 'color', 'font-family', 'font-size', 'font-weight',
      'line-height', 'text-align', 'border', 'border-radius', 'flex',
      'flex-direction', 'align-items', 'justify-content', 'gap', 'grid',
      'grid-template-columns', 'transform', 'opacity', 'box-shadow',
      'overflow', 'cursor', 'z-index', 'transition',
    ];
    const computed = keys
      .map(p => `  ${p}: ${cs.getPropertyValue(p)};`)
      .filter(l => !/(: ;)/.test(l));

    if (computed.length) {
      matched.push(`/* computed (key properties) */\n${selector} {\n${computed.join('\n')}\n}`);
    }

    return matched.join('\n\n') || `/* No matching styles found for: ${selector} */`;
  }

  /**
   * Extracts inline JS event handlers and data-* attributes from the element.
   */
  function extractJS(el) {
    const events = [
      'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover',
      'onmouseout', 'onmouseenter', 'onmouseleave', 'onkeydown', 'onkeyup',
      'onkeypress', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur',
      'onscroll', 'onload', 'onerror', 'ontouchstart', 'ontouchend',
    ];

    const handlers = events
      .filter(ev => el.getAttribute(ev))
      .map(ev => `// ${ev}\nelement.${ev} = function(event) {\n  ${el.getAttribute(ev).trim()}\n};`);

    const dataAttrs = Array.from(el.attributes)
      .filter(a => a.name.startsWith('data-'))
      .map(a => `// ${a.name} = "${a.value}"`);

    if (dataAttrs.length) handlers.push('// Data attributes:\n' + dataAttrs.join('\n'));

    return handlers.length
      ? handlers.join('\n\n')
      : [
          '// No inline JavaScript detected on this element.',
          '// Listeners added via addEventListener() cannot be inspected',
          '// through the standard DOM API.',
        ].join('\n');
  }

  // ── Syntax highlighting ──────────────────────────────────────────────────
  // All helpers: escape first, then inject <span> tokens (safe for Shadow DOM innerHTML)

  function esc(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hlHTML(code) {
    return esc(code)
      // comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<em class="c">$1</em>')
      // closing/opening tag names
      .replace(/(&lt;\/?)([\w-]+)/g, '$1<b class="t">$2</b>')
      // attributes
      .replace(/([\w-]+)=(&quot;[^&]*&quot;)/g, '<i class="a">$1</i>=<s class="s">$2</s>');
  }

  function hlCSS(code) {
    return esc(code)
      // block comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<em class="c">$1</em>')
      // selectors (text before {)
      .replace(/([^{};]+)(\{)/g, '<b class="sel">$1</b>$2')
      // property names
      .replace(/([\w-]+)\s*:/g, '<i class="a">$1</i>:')
      // values
      .replace(/:\s*([^{};]+);/g, ': <s class="v">$1</s>;');
  }

  function hlJS(code) {
    const KW = 'function|var|let|const|if|else|return|new|this|typeof|for|while|do|break|continue|class|import|export|default|null|undefined|true|false|async|await|try|catch|finally|throw';
    return esc(code)
      // line comments
      .replace(/(\/\/[^\n]*)/g, '<em class="c">$1</em>')
      // strings
      .replace(/(&quot;[^&\n]*&quot;|&#39;[^&\n]*&#39;)/g, '<s class="s">$1</s>')
      // keywords
      .replace(new RegExp(`\\b(${KW})\\b`, 'g'), '<b class="kw">$1</b>');
  }

  // ── Markdown builders ─────────────────────────────────────────────────────

  /**
   * Full document (frontmatter + element section) — used when creating new record.
   */
  function buildFullDocument({ html, css, js, selector }) {
    const now = new Date().toISOString();
    return [
      '---',
      'type: element-crawl',
      `url: "${location.href}"`,
      `title: "${document.title.replace(/"/g, '\\"')}"`,
      `extractedAt: ${now}`,
      `element: "${selector}"`,
      '---',
      '',
      `# Element Crawl — ${document.title}`,
      '',
      `> **Page:** ${document.title}  `,
      `> **URL:** ${location.href}  `,
      `> **Extracted:** ${now}`,
      '',
      ...buildElementSectionLines({ html, css, js, selector, now }),
    ].join('\n');
  }

  /**
   * Appended section only (no frontmatter) — used when URL matches existing record.
   */
  function buildElementSection({ html, css, js, selector }) {
    const now = new Date().toISOString();
    return buildElementSectionLines({ html, css, js, selector, now }).join('\n');
  }

  function buildElementSectionLines({ html, css, js, selector, now }) {
    return [
      `## Element: \`${selector}\``,
      '',
      `> Extracted: ${now}`,
      '',
      '### HTML',
      '',
      '```html',
      html,
      '```',
      '',
      '### CSS',
      '',
      '```css',
      css,
      '```',
      '',
      '### JavaScript',
      '',
      '```javascript',
      js,
      '```',
    ];
  }

  // ── Inspect Mode ─────────────────────────────────────────────────────────

  /**
   * Activates DevTools-like inspect mode.
   * Creates a fixed overlay that tracks mouse position, highlights elements,
   * shows an info bar, and lets the user click to select the target element.
   */
  function activateInspectMode() {
    // Remove any stale inspect host
    document.getElementById('__getds_inspect_host__')?.remove();

    let currentElement = lastTarget || null;

    // ── Shadow host (pointer-events:none so mouse reaches page elements) ──
    const host = document.createElement('div');
    host.id = '__getds_inspect_host__';
    host.style.cssText = [
      'all:initial', 'position:fixed', 'inset:0',
      'z-index:2147483646', 'pointer-events:none',
    ].join(';');
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.highlight{
  position:fixed;
  pointer-events:none;
  border:2px solid #6c63ff;
  background:rgba(108,99,255,.12);
  border-radius:2px;
  transition:top 50ms ease,left 50ms ease,width 50ms ease,height 50ms ease;
  z-index:1;
}

.infobar{
  position:fixed;
  bottom:0;left:0;right:0;
  background:rgba(15,15,30,.95);
  border-top:1px solid rgba(108,99,255,.4);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',monospace;
  font-size:12px;
  color:#e2e2f0;
  display:flex;align-items:center;
  padding:6px 12px;
  gap:12px;
  z-index:2;
  pointer-events:all;
}

.tag-badge{
  background:rgba(108,99,255,.2);
  border:1px solid rgba(108,99,255,.4);
  border-radius:4px;
  padding:2px 8px;
  color:#c4b5fd;
  white-space:nowrap;
  flex-shrink:0;
}

.breadcrumb{
  display:flex;align-items:center;gap:2px;
  flex:1;overflow:hidden;
  flex-wrap:wrap;
}

.crumb{
  color:#9ca3af;
  cursor:pointer;
  padding:1px 4px;
  border-radius:3px;
  white-space:nowrap;
  pointer-events:all;
}
.crumb:hover{color:#c4b5fd;background:rgba(108,99,255,.15)}
.crumb-sep{color:#4b5563;font-size:10px}

.dims{
  color:#6b7280;
  white-space:nowrap;
  flex-shrink:0;
}

.hint{
  color:#4b5563;
  white-space:nowrap;
  font-size:11px;
  flex-shrink:0;
}

.tree-toggle{
  background:none;border:none;cursor:pointer;
  color:#6b7280;padding:4px 6px;border-radius:4px;
  font-family:monospace;font-size:11px;font-weight:700;
  transition:color .12s,background .12s;
  pointer-events:all;
  flex-shrink:0;
}
.tree-toggle:hover{color:#c4b5fd;background:rgba(108,99,255,.15)}
.tree-toggle.active{color:#a89cf7;background:rgba(108,99,255,.2)}

.dom-tree-panel{
  position:fixed;
  right:0;top:0;bottom:48px;
  width:280px;
  background:rgba(15,15,30,.95);
  border-left:1px solid rgba(108,99,255,.3);
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',monospace;
  font-size:11px;
  color:#c9d1d9;
  overflow-y:auto;
  overflow-x:hidden;
  z-index:3;
  pointer-events:all;
  display:none;
}
.dom-tree-panel.open{display:block}

.tree-header{
  padding:8px 10px;
  font-size:10px;font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:#555;
  border-bottom:1px solid rgba(255,255,255,.06);
  position:sticky;top:0;
  background:rgba(15,15,30,.98);
}

.tree-node{
  padding:3px 6px;
  cursor:pointer;
  white-space:nowrap;
  color:#9ca3af;
  border-radius:2px;
  transition:background .1s,color .1s;
}
.tree-node:hover{background:rgba(108,99,255,.1);color:#c4b5fd}
.tree-node.selected{background:rgba(108,99,255,.2);color:#a89cf7;font-weight:600}
.tree-node.ancestor{color:#6b7280}
.tree-node.child{color:#555}
</style>

<div class="highlight" id="hl"></div>
<div class="dom-tree-panel" id="tree-panel">
  <div class="tree-header">DOM Tree</div>
  <div id="tree-content"></div>
</div>
<div class="infobar" id="bar">
  <span class="tag-badge" id="tag-badge"></span>
  <div class="breadcrumb" id="breadcrumb"></div>
  <span class="dims" id="dims"></span>
  <button class="tree-toggle" id="tree-toggle" title="Toggle DOM tree (T)">&lt;/&gt;</button>
  <span class="hint">↑↓ parent/child • ←→ siblings • T tree • click to select • Esc cancel</span>
</div>`;

    const hlBox     = shadow.getElementById('hl');
    const tagBadge  = shadow.getElementById('tag-badge');
    const breadcrumb = shadow.getElementById('breadcrumb');
    const dimsEl    = shadow.getElementById('dims');

    function getAncestors(el) {
      const ancestors = [];
      let cur = el;
      while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
        ancestors.unshift(cur);
        cur = cur.parentElement;
      }
      return ancestors;
    }

    function buildTagLabel(el) {
      let label = el.tagName.toLowerCase();
      if (el.classList.length) {
        const cls = Array.from(el.classList).slice(0, 2).join('.');
        if (cls) label += '.' + cls;
      }
      if (el.id) label += '#' + el.id;
      return label;
    }

    function updateUI(el) {
      if (!el || el.nodeType !== 1) return;

      const rect = el.getBoundingClientRect();
      hlBox.style.top    = rect.top    + 'px';
      hlBox.style.left   = rect.left   + 'px';
      hlBox.style.width  = rect.width  + 'px';
      hlBox.style.height = rect.height + 'px';

      tagBadge.textContent = '<' + buildTagLabel(el) + '>';

      const ancestors = getAncestors(el);
      breadcrumb.innerHTML = ancestors.map((anc, i) => {
        const label = buildTagLabel(anc);
        const isLast = i === ancestors.length - 1;
        return (i > 0 ? '<span class="crumb-sep">›</span>' : '') +
          `<span class="crumb${isLast ? ' crumb-active' : ''}" data-idx="${i}">${label}</span>`;
      }).join('');

      // Attach click handlers to breadcrumb segments
      breadcrumb.querySelectorAll('.crumb').forEach(crumbEl => {
        crumbEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(crumbEl.dataset.idx, 10);
          currentElement = ancestors[idx];
          updateUI(currentElement);
        });
      });

      dimsEl.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} px`;

      // Update DOM tree panel if open
      renderTree(el);
    }

    // Initial highlight if we have a lastTarget
    if (currentElement) updateUI(currentElement);

    // ── Event listeners ────────────────────────────────────────────────────

    function onMouseMove(e) {
      // Temporarily hide the host so elementFromPoint sees the real page
      host.style.display = 'none';
      const target = document.elementFromPoint(e.clientX, e.clientY);
      host.style.display = '';

      if (!target || target === document.documentElement || target === document.body) return;

      currentElement = target;
      updateUI(currentElement);
    }

    function onClick(e) {
      if (!currentElement) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      deactivate();
      showModal(currentElement);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') {
        deactivate();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentElement && currentElement.parentElement &&
            currentElement.parentElement.nodeType === 1 &&
            currentElement.parentElement !== document.documentElement) {
          currentElement = currentElement.parentElement;
          updateUI(currentElement);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentElement && currentElement.firstElementChild) {
          currentElement = currentElement.firstElementChild;
          updateUI(currentElement);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentElement && currentElement.previousElementSibling) {
          currentElement = currentElement.previousElementSibling;
          updateUI(currentElement);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentElement && currentElement.nextElementSibling) {
          currentElement = currentElement.nextElementSibling;
          updateUI(currentElement);
        }
      } else if (e.key === 'T' || e.key === 't') {
        e.preventDefault();
        toggleTreePanel();
      }
    }

    // ── DOM Tree panel ──────────────────────────────────────────────────────
    const treePanel   = shadow.getElementById('tree-panel');
    const treeContent = shadow.getElementById('tree-content');
    const treeTogBtn  = shadow.getElementById('tree-toggle');
    let treePanelOpen = false;
    let renderTreeTimer = null;

    function toggleTreePanel() {
      treePanelOpen = !treePanelOpen;
      treePanel.classList.toggle('open', treePanelOpen);
      treeTogBtn.classList.toggle('active', treePanelOpen);
      if (treePanelOpen && currentElement) renderTree(currentElement);
    }

    treeTogBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTreePanel();
    });

    function renderTree(el) {
      if (!treePanelOpen || !treeContent) return;

      // Debounce 50ms
      if (renderTreeTimer) clearTimeout(renderTreeTimer);
      renderTreeTimer = setTimeout(() => doRenderTree(el), 50);
    }

    function doRenderTree(el) {
      treeContent.innerHTML = '';
      const ancestors = getAncestors(el);

      // For each ancestor level, show siblings of that ancestor
      for (let depth = 0; depth < ancestors.length; depth++) {
        const anc = ancestors[depth];
        const parent = anc.parentElement;
        const siblings = parent ? Array.from(parent.children) : [anc];

        for (const sib of siblings) {
          const node = document.createElement('div');
          node.className = 'tree-node';
          node.style.paddingLeft = (depth * 14 + 6) + 'px';
          node.textContent = buildTagLabel(sib);

          if (sib === el) {
            node.classList.add('selected');
          } else if (sib === anc) {
            node.classList.add('ancestor');
          }

          node.addEventListener('click', (ev) => {
            ev.stopPropagation();
            currentElement = sib;
            updateUI(currentElement);
          });

          treeContent.appendChild(node);
        }
      }

      // Show first-level children of the selected element
      const children = Array.from(el.children);
      const childDepth = ancestors.length;
      for (const child of children) {
        const node = document.createElement('div');
        node.className = 'tree-node child';
        node.style.paddingLeft = (childDepth * 14 + 6) + 'px';
        node.textContent = buildTagLabel(child);

        node.addEventListener('click', (ev) => {
          ev.stopPropagation();
          currentElement = child;
          updateUI(currentElement);
        });

        treeContent.appendChild(node);
      }

      // Scroll selected node into view
      const selected = treeContent.querySelector('.selected');
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }

    function deactivate() {
      if (renderTreeTimer) clearTimeout(renderTreeTimer);
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeydown, true);
      host.remove();
    }

    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeydown, true);
  }

  // ── Modal ────────────────────────────────────────────────────────────────

  function showModal(el) {
    // Remove any stale modal
    document.getElementById('__getds_modal_host__')?.remove();

    const html     = el.outerHTML;
    const css      = extractCSS(el);
    const js       = extractJS(el);
    const selector = buildSelector(el);

    // Shadow host — fixed overlay, highest z-index
    const host = document.createElement('div');
    host.id = '__getds_modal_host__';
    host.style.cssText = [
      'all:initial', 'position:fixed', 'inset:0',
      'z-index:2147483647', 'pointer-events:none',
    ].join(';');
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.overlay{
  all:initial;
  position:fixed;inset:0;
  background:rgba(0,0,0,.75);
  backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  z-index:2147483647;
  pointer-events:all;
}

.modal{
  background:#0f0f1e;
  border:1px solid rgba(108,99,255,.35);
  border-radius:14px;
  width:min(94vw,980px);
  max-height:92vh;
  display:flex;flex-direction:column;
  color:#e2e2f0;
  box-shadow:0 32px 96px rgba(0,0,0,.8),0 0 0 1px rgba(108,99,255,.12);
  overflow:hidden;
}

/* ── Header ── */
.mhdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 20px;
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
  background:rgba(108,99,255,.06);
}
.mtitle{
  display:flex;align-items:center;gap:8px;
  font-size:14px;font-weight:600;color:#c4b5fd;
}
.mtitle svg{flex-shrink:0}
.badge{
  font-size:11px;padding:2px 10px;
  background:rgba(108,99,255,.2);
  border:1px solid rgba(108,99,255,.4);
  border-radius:20px;color:#a89cf7;
  font-weight:500;max-width:300px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.btnX{
  background:none;border:none;cursor:pointer;
  color:#555;padding:6px;border-radius:7px;
  display:flex;align-items:center;justify-content:center;
  transition:color .15s,background .15s;
}
.btnX:hover{color:#e2e2f0;background:rgba(255,255,255,.09)}

/* ── Body ── */
.mbody{
  display:flex;flex-direction:column;
  overflow:hidden;flex:1;
  padding:16px 20px;gap:12px;
}

/* ── Preview ── */
.plabel{
  font-size:10px;font-weight:700;letter-spacing:.07em;
  color:#555;text-transform:uppercase;margin-bottom:6px;
}
.pframe{
  background:#fff;border-radius:8px;
  border:1px solid rgba(255,255,255,.1);
  min-height:52px;max-height:130px;
  overflow:auto;
  display:flex;align-items:center;justify-content:center;
  padding:10px 12px;
  flex-shrink:0;
}

/* ── Tabs ── */
.tlist{
  display:flex;gap:2px;
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.tbtn{
  background:none;border:none;cursor:pointer;
  padding:6px 16px;font-size:12.5px;color:#666;
  border-bottom:2px solid transparent;
  margin-bottom:-1px;
  transition:color .15s,border-color .15s;
  border-radius:6px 6px 0 0;font-family:inherit;
}
.tbtn:hover{color:#c4b5fd;background:rgba(255,255,255,.04)}
.tbtn.on{color:#a89cf7;border-bottom-color:#6c63ff;font-weight:600}
.tpanel{display:none}
.tpanel.on{display:block}

/* ── Code block ── */
.code{
  min-height:160px;max-height:210px;
  overflow:auto;
  background:#08080f;
  border:1px solid rgba(255,255,255,.06);
  border-radius:8px;
  padding:13px 15px;
  font-family:'JetBrains Mono','Fira Code',ui-monospace,monospace;
  font-size:12px;line-height:1.7;
  white-space:pre;color:#c9d1d9;
  tab-size:2;
}
em.c{color:#6e7681;font-style:normal}
b.t{color:#7ee787;font-weight:normal}
b.sel{color:#d2a8ff;font-weight:normal}
b.kw{color:#ff7b72;font-weight:600}
i.a{color:#79c0ff;font-style:normal}
s.s{color:#a5d6ff;text-decoration:none}
s.v{color:#ffa657;text-decoration:none}

/* ── Footer ── */
.mftr{
  display:flex;align-items:center;justify-content:flex-end;
  padding:13px 20px;
  border-top:1px solid rgba(255,255,255,.07);
  gap:10px;flex-shrink:0;
  background:rgba(0,0,0,.2);
}
.saved-msg{
  font-size:12px;color:#34d399;margin-right:auto;
  opacity:0;transition:opacity .3s;
  display:flex;align-items:center;gap:5px;
}
.saved-msg.show{opacity:1}
.btn{
  padding:7px 18px;border-radius:8px;
  font-size:12.5px;font-weight:600;cursor:pointer;
  border:1px solid transparent;
  transition:all .15s;font-family:inherit;
  display:inline-flex;align-items:center;gap:6px;
}
.btn-ghost{
  background:none;border-color:rgba(255,255,255,.14);color:#777;
}
.btn-ghost:hover{border-color:rgba(255,255,255,.28);color:#e2e2f0;background:rgba(255,255,255,.06)}
.btn-save{background:#6c63ff;border-color:#6c63ff;color:#fff}
.btn-save:hover{background:#7c6fff}
.btn-save:active{background:#5a52e6;transform:scale(.97)}

::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:3px}
</style>

<div class="overlay" id="ov">
  <div class="modal" role="dialog" aria-modal="true" aria-label="Element Crawler">

    <!-- Header -->
    <div class="mhdr">
      <div class="mtitle">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
          <path d="M11 8v6M8 11h6"/>
        </svg>
        Element Crawler
        <span class="badge" title="${esc(selector)}">${esc(selector)}</span>
      </div>
      <button class="btnX" id="btnX" aria-label="Close">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="mbody">

      <!-- Preview -->
      <div>
        <div class="plabel">Element Preview</div>
        <div class="pframe" id="pframe"></div>
      </div>

      <!-- Tabs -->
      <div class="tlist" role="tablist">
        <button class="tbtn on" data-tab="html" role="tab" aria-selected="true">HTML</button>
        <button class="tbtn" data-tab="css"  role="tab" aria-selected="false">CSS</button>
        <button class="tbtn" data-tab="js"   role="tab" aria-selected="false">JavaScript</button>
      </div>

      <div class="tpanel on" id="panel-html">
        <div class="code">${hlHTML(html)}</div>
      </div>
      <div class="tpanel" id="panel-css">
        <div class="code">${hlCSS(css)}</div>
      </div>
      <div class="tpanel" id="panel-js">
        <div class="code">${hlJS(js)}</div>
      </div>

    </div>

    <!-- Footer -->
    <div class="mftr">
      <span class="saved-msg" id="saved-msg">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Saved to report!
      </span>
      <button class="btn btn-ghost" id="btnCancel">Cancel</button>
      <button class="btn btn-save" id="btnSave">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save to Markdown
      </button>
    </div>

  </div>
</div>`;

    // ── Preview: clone element into white frame ──────────────────────────
    const pframe = shadow.getElementById('pframe');
    try {
      const clone = el.cloneNode(true);
      clone.style.cssText += ';max-width:100%;max-height:110px;pointer-events:none';
      pframe.appendChild(clone);
    } catch {
      pframe.textContent = selector;
    }

    // ── Tab switching ────────────────────────────────────────────────────
    const tabBtns   = shadow.querySelectorAll('.tbtn');
    const tabPanels = shadow.querySelectorAll('.tpanel');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        tabBtns.forEach(b => {
          b.classList.toggle('on', b.dataset.tab === id);
          b.setAttribute('aria-selected', b.dataset.tab === id ? 'true' : 'false');
        });
        tabPanels.forEach(p => p.classList.toggle('on', p.id === `panel-${id}`));
      });
    });

    // ── Close handlers ───────────────────────────────────────────────────
    const close = () => host.remove();
    shadow.getElementById('btnX').addEventListener('click', close);
    shadow.getElementById('btnCancel').addEventListener('click', close);
    shadow.getElementById('ov').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) close();
    });
    document.addEventListener('keydown', function onKeydown(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKeydown); }
    });

    // ── Save handler ─────────────────────────────────────────────────────
    shadow.getElementById('btnSave').addEventListener('click', () => {
      const markdown = buildFullDocument({ html, css, js, selector });
      const section  = buildElementSection({ html, css, js, selector });
      chrome.runtime.sendMessage(
        {
          type    : 'ELEMENT_CRAWL_SAVE',
          markdown,
          section,
          title   : `${document.title} — ${selector}`,
          url     : location.href,
          selector,
        },
        () => {
          const msgEl = shadow.getElementById('saved-msg');
          msgEl.classList.add('show');
          setTimeout(() => { msgEl.classList.remove('show'); close(); }, 1600);
        },
      );
    });

    // Focus trap: put focus on close button
    shadow.getElementById('btnX').focus();
  }

})();
