# getds — Design System Extractor

**getds** is a Google Chrome extension designed to automatically extract design tokens, components, and interface patterns from any web page.

With **getds**, designers and developers can quickly inspect design decisions (such as color palettes, typography, spacing scales, and component usage) adopted on reference sites, aiding in the creation and maintenance of Design Systems.

## The Problem getds Solves

Building a website that *looks like* a reference site is harder than it sounds.

Consider this scenario: a designer gives an AI the following prompt —

> *"Create a simple SaaS sales landing page as a template."*

The result is predictable: a clean, functional, but **entirely generic** page. Light background, standard sans-serif font, a purple CTA button. Nothing wrong with it — but it carries no visual personality whatsoever.

Now imagine the actual goal was to capture the essence of a site like [Agence Foudre](https://www.agencefoudre.com/) — a page defined by its **deep black background**, **condensed bold uppercase typography**, **hot-pink accent highlights**, oversized spatial rhythm, and stacked card layouts. The visual gap between the generic output and the reference site is enormous, and no amount of prompt engineering can close it — because the AI simply doesn't know the *exact* tokens that make that design what it is.

**This is exactly the problem getds solves.**

| Stage | What you have | What the AI produces |
|---|---|---|
| Generic prompt only | "Make a SaaS landing page like this reference site" | A bland, template-looking page with no visual identity |
| With getds extraction | Full token report: `background: #0A0A0A`, `accent: #FF3D9A`, `font: "Druk Wide Bold"`, spacing scale, animation curves... | A page that *genuinely* captures the design DNA of the reference |

getds runs directly in your browser, scans the reference site, and exports a structured Markdown report containing every measurable design decision: color palettes, typographic scales, spacing rhythms, component patterns, animation timings, and more. Feed that report to any AI coding tool and the output transforms from generic to genuinely on-brand.

> **In short:** getds converts any website's visual identity into a machine-readable design system — so AI tools can reconstruct it faithfully instead of guessing.

## 🚀 Features

**getds** runs directly in the browser and scans the current page to perform comprehensive extraction and auditing:

### 🎨 Design Tokens Extraction
- **Colors:** Backgrounds, Text, Borders, Gradients, deduced semantic roles, and color grouping by hue.
- **Typography:** Font families, Typographic scales, Fluid typography, Variable fonts, Line heights, and Text shadows.
- **Spacing & Layout:** Spacing scales, Grid tokens, Inset spacing, Gutters, Flexbox and CSS Grid layouts.
- **Shapes & Effects:** Border radius scales, Box shadows (Elevation), Opacity, and CSS Filters.

### 🧩 Component Detection
- **Structural Mapping:** Identifies Buttons, Cards, Modals, Navigation patterns, Tables, Pill shapes, and Form Inputs/Layouts.
- **Component Variants:** Detects and records interactive state changes (`:hover`, `:focus`, `:active`, `:disabled`).
- **Icons & Media:** Extracts Inline SVGs, Icon fonts, SVG references, and creates icon inventories.

### ♿ Accessibility (A11y) Auditing
- **Contrast & Visibility:** Checks foreground/background contrast violations.
- **Semantic Structure:** Audits Heading hierarchy, ARIA usage, and Alt texts.
- **Usability:** Validates Focus styles, Touch targets, and Reduced Motion preferences.

### 🎥 Motion & Spatial Design
- **Animations:** Extracts CSS Keyframes, Web Animations API, Transitions, Scroll-driven animations, SVG animations, and Event triggers.
- **3D & Canvas:** Detects WebGL canvases, 3D model references, and 3D component libraries (e.g., Three.js).

### 🛠️ Developer Output & Reports
- **Markdown Export:** Generates rich Markdown reports equipped with data tables, CSS reconstruction snippets, and Frontmatter.
- **Mermaid Diagrams:** Renders visual diagrams of the page's hierarchical and structural patterns.
- **AI Reconstruction Guides:** Provides an advanced blueprint optimized for AI-driven visual reconstruction.

## 📁 Project Structure

The extension's architecture is divided into the following main folders inside `src/`:

- `src/content/`: Scripts injected into pages to read and extract tokens and components from the DOM and CSSOM. It features over 150+ detectors, mappers, and auditors focused on specific design areas (colors, typography, spacing, a11y, animations, metadata extraction, etc).
- `src/popup/`: Visual interface of the extension that the user sees upon clicking the Chrome icon (HTML, CSS, and scripts responsible for communication with the capture panel).
- `src/background/`: *Service Workers* responsible for orchestrating communication between the `popup` and the `content scripts`, as well as managing the extension's lifecycle events.
- `src/lib/`: Shared utilities and libraries (such as `dbStorage.js` for robust IndexedDB data management).

## 🛠 Technologies Used

- **JavaScript (Vanilla):** End-to-end extension logic.
- **Bun:** Used primarily for executing ultra-fast unit tests.
- **Happy DOM:** To simulate the browser environment (DOM) during tests (Node/Bun).

## 📦 How to Install (Development Environment)

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/charlenopires/getds.git
   cd getds
   ```
2. Install the dependencies (required to run tests locally):
   ```bash
   bun install
   ```
3. Open Google Chrome and go to the Extensions Management page:
   - Type `chrome://extensions/` in the address bar.
4. Enable **"Developer mode"** in the top right corner.
5. Click the **"Load unpacked"** button and select the root folder of this repository (`getds`).
6. The extension will be loaded and the **getds** icon will be available in your Chrome extensions bar.

## 🏗 How to Build the Extension

The extension does **not require a bundler** — it uses Manifest V3 with native ES modules, so the source files are loaded directly by Chrome. No compilation step is needed.

### Load for development (no build needed)

```bash
# 1. Install dependencies (test tooling only)
bun install

# 2. Open Chrome → chrome://extensions/ → Enable "Developer mode"
# 3. Click "Load unpacked" → select the root folder of the repo
```

Chrome reads `manifest.json` from the project root and serves `src/` files as-is.

### Package for distribution (.crx / Chrome Web Store)

To create a distributable package from the Chrome Extensions page:

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **"Pack extension"**
4. Set **Extension root directory** to the repo root (`getds/`)
5. Leave **Private key file** empty on first pack (Chrome will generate `getds.pem`) — keep this file secret for future updates
6. Click **"Pack Extension"** — Chrome generates:
   - `getds.crx` — installable extension file
   - `getds.pem` — private key (store securely, do not commit)

To submit to the **Chrome Web Store**, zip the repo root (excluding `node_modules`, `.git`, and `*.pem`) and upload at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).

```bash
# Create a clean zip for the Web Store submission
zip -r getds.zip . \
  --exclude "*.git*" \
  --exclude "node_modules/*" \
  --exclude "*.pem" \
  --exclude "*.test.js" \
  --exclude "bunfig.toml" \
  --exclude "bun.lock"
```

### Required assets before packaging

The manifest references icon files that must exist:

```
assets/
  icon16.png   (16×16 px)
  icon48.png   (48×48 px)
  icon128.png  (128×128 px)
```

Generate these from an SVG source or any image editor before packing.

## 🧪 How to Run Tests

The project features a rich unit test suite, covering all interface extractors within `src/content` and `src/popup`.

To run all tests using **Bun**:

```bash
# Run all tests once
bun run test

# Run tests in "watch" mode (continuous file observation)
bun run test:watch
```

## 🤝 How to Contribute

Contributions are highly welcome! Feel free to submit *Pull Requests* or open *Issues* reporting bugs or suggesting new features.

1. Fork this repository.
2. Create a branch for your *feature* or fix: `git checkout -b my-feature`
3. Commit your changes: `git commit -m 'feat: my new feature'`
4. Push the branch: `git push origin my-feature`
5. Open a *Pull Request* detailing what was done.

## 📄 License

Developed with the community, initiated by [@charlenopires](https://github.com/charlenopires). Please check standard licensing terms (MIT / Other) if provided in the final repository.
