# Spine Player VSCode Extension

The Spine Player VSCode extension allows you to preview and interact with Spine animations directly inside Visual Studio Code. It is designed for game developers and animators who want to inspect skeletons, switch animations, and validate asset resolution without leaving their editor.

## Features

- Open Spine animations directly from a `json` skeleton file
- Resolve the matching atlas dynamically instead of relying on fixed filename assumptions
- Support shared atlas files used by multiple animation JSON files
- Support atlas image textures in both `.png` and `.webp` formats
- Preview the animation in a VSCode webview panel with the standard Spine player controls
- A custom neon helix icon for quick recognition in the Extensions view

## Usage

1. **Open a Spine JSON file in Explorer**
   - Right-click the `.json` file and choose `Play Spine Animation`.
   - The extension will locate the matching atlas in the same folder or nearby files and resolve the texture automatically.

2. **Use a shared atlas**
   - If several JSON files share one atlas, the extension will prompt you to choose the atlas when multiple matches are available.

3. **Compatibility**
   - Existing `.atlas`-based workflows still work as a fallback for older project layouts.

4. **Interact with the animation**
   - The Spine Player loads in a webview and plays the first available animation by default.

## Development/debugging

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   ```
2. **Install Dependencies**
   ```bash
   cd <repository-directory>
   npm install
   ```
3. **Compile the Extension**
   ```bash
   npm run compile
   ```
4. **Launch the Extension**
   - Open "Run & Debug"
   - Choose "Run Extension"
   - Press `F5` to open a new VSCode window with the extension loaded.

## Contribution

1. **Fork the Repository**
   - Create a fork of the repository on GitHub.

2. **Create a Branch**
   - Create a new branch for your feature or bugfix.
   ```bash
   git checkout -b feature-name
   ```

3. **Make Your Changes**
   - Make your changes and commit them with a meaningful commit message.
   ```bash
   git commit -m "Add new feature"
   ```

4. **Push Changes**
   - Push your changes to your fork.
   ```bash
   git push origin feature-name
   ```

5. **Create a Pull Request**
   - Create a pull request from your fork's branch to the main repository.

## License

This project is licensed under the MIT License.

## Contributors

ChatGPT created the initial plugin skeleton, and the current extension includes shared-atlas support and PNG/WebP texture handling.