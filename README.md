# getds — Design System Extractor

**getds** is a Google Chrome extension designed to automatically extract design tokens, components, and interface patterns from any web page.

With **getds**, designers and developers can quickly inspect design decisions (such as color palettes, typography, spacing scales, and component usage) adopted on reference sites, aiding in the creation and maintenance of Design Systems.

## 🚀 Features

**getds** runs directly in the browser and scans the current page to identify:

- **Primitive and Semantic Tokens:** Colors (Background, Text, Borders), Font Families, Font Sizes (Typographic Scale), Shadows (Elevation), and Spacing.
- **Component Detection:** Structural identification of complex elements like Buttons, Cards, Modals, Navigation, Tables, and Form Inputs.
- **Animations and Motion:** Extraction of *keyframes*, CSS transitions, and web animations.
- **Component Variants:** Mapping of state changes (`:hover`, `:focus`, `:active`, `:disabled`).

## 📁 Project Structure

The extension's architecture is divided into the following main folders inside `src/`:

- `src/content/`: Scripts injected into pages to read and extract tokens and components from the DOM and CSSOM. It features various detectors and mappers focused on specific design areas (colors, typography, spacing, animations, etc).
- `src/popup/`: Visual interface of the extension that the user sees upon clicking the Chrome icon (HTML, CSS, and scripts responsible for communication with the capture panel).
- `src/background/`: *Service Workers* responsible for orchestrating communication between the `popup` and the `content scripts`, as well as managing the extension's lifecycle events.

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

Developed to assist the community. Please check standard licensing terms (MIT / Other) if provided in the final repository.
