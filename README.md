# Authenta-Chrome-Plugin

This repository contains the code for the chrome plugin of Authenta.

## Local Testing Instructions

To test the Authenta Chrome Plugin locally, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/authenta-chrome-plugin.git
    cd authenta-chrome-plugin
    ```

2. **Install dependencies (if applicable):**
    ```bash
    npm install
    ```

3. **Build the plugin (if required):**
    ```bash
    npm run build
    ```     

4. **Load the extension in Chrome:**
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable "Developer mode" (toggle in the top right).
    - Click "Load unpacked" and select the `dist` or `build` directory (or the root directory if no build step is needed).

5. **Test the plugin:**
    - The extension should now be active in your browser.
    - Interact with the plugin as needed to verify functionality.

> **Note:** If you make changes to the code, repeat the build and reload steps to see updates. 


## Project Structure

The repository is organized as follows:

```
authenta-chrome-plugin/
├── src/                # Source code for the Chrome extension
│   ├── background.js   # Background script for handling extension events
│   ├── content.js      # Content script injected into web pages
│   ├── popup/          # Popup UI components
│   │   └── popup.html  # HTML for the popup window
│   └── assets/         # Static assets (icons, images, etc.)
├── dist/ or build/     # Compiled output after building the extension
├── manifest.json       # Chrome extension manifest file
├── package.json        # Project metadata and dependencies
├── README.md           # Project documentation (this file)
└── ...                 # Additional configuration or documentation files
```

- **src/**: Contains all the source code and assets for the extension.
- **background.js**: Handles background tasks and extension lifecycle events.
- **content.js**: Runs in the context of web pages to interact with page content.
- **popup/**: Contains files related to the extension's popup interface.
- **assets/**: Stores images, icons, and other static resources.
- **dist/** or **build/**: Output directory for the built extension, ready for loading into Chrome.
- **manifest.json**: Defines extension metadata, permissions, and scripts.
- **package.json**: Lists dependencies and scripts for development.
- **README.md**: Provides documentation and usage instructions.

This structure helps maintain a clear separation of concerns and makes the project easy to navigate.