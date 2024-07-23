# Spine Player VSCode Extension

The Spine Player VSCode extension allows you to embed and play Spine animations directly within Visual Studio Code. This extension is useful for game developers and animators who want to preview and interact with their Spine animations without leaving the editor.

## Features

- **Embed Spine Animations**: Display Spine animations directly in a VSCode webview.

## Usage

1. **Click on an .atlas file in Explorer**
   - Ensure the same folder has corresponding .json and .png files.

2. **Run Spine Animation Command**
   - Right click on the .atlas file and select \`Play Spine Animation\`

3. **Interact with the Animation**
   - The Spine Player will display your animation in a webview panel.
   - Use the player controls to select an animation and control it.

## Development/debugging

1. **Clone the Repository**
   \`\`\`bash
   git clone <repository-url>
   \`\`\`
2. **Install Dependencies**
   \`\`\`bash
   cd <repository-directory>
   npm install
   \`\`\`
3. **Compile the Extension**
   \`\`\`bash
   npm run compile
   \`\`\`
4. **Launch the Extension**
   - Open "Run & Debug"
   - Choose "Run Extension"
   - Press \`F5\` to open a new VSCode window with the extension loaded.

## Contribution

1. **Fork the Repository**
   - Create a fork of the repository on GitHub.

2. **Create a Branch**
   - Create a new branch for your feature or bugfix.
     \`\`\`bash
     git checkout -b feature-name
     \`\`\`

3. **Make Your Changes**
   - Make your changes and commit them with a meaningful commit message.
     \`\`\`bash
     git commit -m "Add new feature"
     \`\`\`

4. **Push Changes**
   - Push your changes to your fork.
     \`\`\`bash
     git push origin feature-name
     \`\`\`

5. **Create a Pull Request**
   - Create a pull request from your fork's branch to the main repository.

## License

This project is licensed under the MIT License.

## Contributors

ChatGPT create skeleton of plugin.