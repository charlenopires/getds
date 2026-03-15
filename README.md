# getds — Design System Extractor

**getds** is a Google Chrome extension that automatically extracts design tokens, components, and visual patterns from any web page — and exports them as a structured Markdown report ready to feed into any AI coding tool.

---

## The Problem getds Solves

Ask any AI to build a website. You get something like this:

<br>

**Prompt:** *"Create a simple SaaS sales landing page as a template."*

![Generic AI-generated landing page — clean but visually bland](docs/images/base.png)

Clean. Functional. Completely generic. Light background, standard sans-serif font, a purple CTA button. The AI did its job — but the output carries zero visual personality.

<br>

Now suppose your actual goal was to capture the essence of a site like this:

![Agence Foudre — bold hot-pink palette, condensed uppercase type, distinctive stacked-card layout](docs/images/ref.png)

**[agencefoudre.com](https://www.agencefoudre.com/)** — defined by a vivid hot-pink palette, condensed bold uppercase typography, oversized spatial rhythm, and a stacked-card layout. The visual language is instantly recognizable.

<br>

No amount of prompt engineering can close that gap — because the AI simply doesn't know the *exact* tokens that make that design what it is: the precise background tones, the specific font weights, the spacing scale, the animation curves.

**This is exactly the problem getds solves.**

Run getds on the reference site, get the full token report, feed it to your AI tool — and the result transforms:

![Same landing page rebuilt with Agence Foudre's design DNA — dark background, bold type, hot-pink accents](docs/images/result.png)

Same page. Same prompt. Completely different output — because now the AI knows the exact design tokens of the reference.

<br>

> **In short:** getds converts any website's visual identity into a machine-readable design system — so AI tools can reconstruct it faithfully instead of guessing.

<br>

| Stage | Input | AI Output |
|---|---|---|
| Generic prompt only | "Make a SaaS landing page" | Bland, template-looking page with no visual identity |
| Prompt + getds report | Full token report: `background: #0A0A0A`, `accent: #FF3D9A`, `font: "Druk Wide Bold"`, spacing scale, animation curves… | A page that genuinely captures the design DNA of the reference |

---

## Features

getds runs directly in the browser and scans the current page to perform comprehensive extraction and auditing:

### Design Tokens Extraction

- **Colors:** Backgrounds, text, borders, gradients, deduced semantic roles, and color grouping by hue
- **Typography:** Font families, typographic scales, fluid typography, variable fonts, line heights, and text shadows
- **Spacing & Layout:** Spacing scales, grid tokens, inset spacing, gutters, flexbox and CSS Grid layouts
- **Shapes & Effects:** Border radius scales, box shadows (elevation), opacity, and CSS filters

### Component Detection

- **Structural Mapping:** Identifies buttons, cards, modals, navigation patterns, tables, pill shapes, and form inputs/layouts
- **Component Variants:** Detects and records interactive state changes (`:hover`, `:focus`, `:active`, `:disabled`)
- **Icons & Media:** Extracts inline SVGs, icon fonts, SVG references, and creates icon inventories

### Accessibility (A11y) Auditing

- **Contrast & Visibility:** Checks foreground/background contrast violations
- **Semantic Structure:** Audits heading hierarchy, ARIA usage, and alt texts
- **Usability:** Validates focus styles, touch targets, and reduced-motion preferences

### Motion & Spatial Design

- **Animations:** Extracts CSS keyframes, Web Animations API, transitions, scroll-driven animations, SVG animations, and event triggers
- **3D & Canvas:** Detects WebGL canvases, 3D model references, and 3D component libraries (e.g., Three.js)

### Developer Output & Reports

- **Markdown Export:** Generates rich Markdown reports with data tables, CSS reconstruction snippets, and YAML frontmatter
- **Mermaid Diagrams:** Renders visual diagrams of the page's hierarchical and structural patterns
- **AI Reconstruction Guides:** Provides an advanced blueprint optimized for AI-driven visual reconstruction

---

## Project Structure

```
src/
├── content/      # Scripts injected into pages — 150+ detectors for colors, typography,
│                 # spacing, a11y, animations, and metadata
├── popup/        # Extension UI (HTML/CSS/JS) — the panel the user sees on clicking the icon
├── background/   # Service workers orchestrating popup ↔ content script messaging
└── lib/          # Shared utilities (IndexedDB storage, helpers)
```

---

## Technologies

| Tool | Role |
|---|---|
| JavaScript (Vanilla) | End-to-end extension logic |
| Bun | Ultra-fast unit test runner |
| Happy DOM | DOM simulation for tests (Node/Bun environment) |

---

## Install (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/charlenopires/getds.git
   cd getds
   ```
2. Install dependencies (test tooling only):
   ```bash
   bun install
   ```
3. Open Chrome → `chrome://extensions/`
4. Enable **Developer mode** (top-right toggle)
5. Click **"Load unpacked"** → select the repo root folder
6. The **getds** icon appears in your Chrome extensions bar

---

## Build & Distribution

The extension requires **no bundler** — Manifest V3 with native ES modules means Chrome loads source files directly.

### Development (no build step needed)

```bash
bun install
# Then: Chrome → chrome://extensions/ → Developer mode → Load unpacked → repo root
```

### Package for the Chrome Web Store

```bash
# Create a clean zip for Web Store submission
zip -r getds.zip . \
  --exclude "*.git*" \
  --exclude "node_modules/*" \
  --exclude "*.pem" \
  --exclude "*.test.js" \
  --exclude "bunfig.toml" \
  --exclude "bun.lock"
```

Or use Chrome's built-in packer: `chrome://extensions/` → **Pack extension** → select repo root.

> Keep the generated `getds.pem` private key secure — never commit it.

### Required icon assets

```
assets/
  icon16.png    (16×16 px)
  icon48.png    (48×48 px)
  icon128.png   (128×128 px)
```

---

## Run Tests

```bash
# Run all tests once
bun run test

# Watch mode (re-runs on file changes)
bun run test:watch
```

---

## Contributing

Contributions are welcome. To propose a change:

1. Fork the repository
2. Create a branch: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'feat: my new feature'`
4. Push: `git push origin my-feature`
5. Open a Pull Request describing what was done

---

## License

Developed with the community, initiated by [@charlenopires](https://github.com/charlenopires). See the repository for licensing terms.
