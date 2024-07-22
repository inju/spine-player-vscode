import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewContent } from './webviewContent';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "indrek-juhani.spine-player-vscode" is now active.');

  let playSpineAnimation = vscode.commands.registerCommand('indrek-juhani.spine-player-vscode.playSpineAnimation', async (uri: vscode.Uri) => {
    console.log('Play Spine Animation command called with URI:', uri);

    if (uri && uri.fsPath) {
      const atlasFilePath = uri.fsPath;
      const jsonFilePath = atlasFilePath.replace('.atlas', '.json');
      const imageFilePath = atlasFilePath.replace('.atlas', '.png'); // Assuming image file has the same name base as the atlas

      if (fs.existsSync(jsonFilePath) && fs.existsSync(imageFilePath)) {
        console.log('JSON file and image file exist.');
        currentPanel = vscode.window.createWebviewPanel(
          'spinePlayer',
          'Spine Player',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.dirname(atlasFilePath))]
          }
        );

        // Pass the webview instance to getWebviewContent
        currentPanel.webview.html = getWebviewContent(atlasFilePath, jsonFilePath, imageFilePath, currentPanel.webview);
        console.log('Webview panel created.');
      } else {
        vscode.window.showErrorMessage('Corresponding JSON skeleton file or image file not found.');
        console.error('Corresponding JSON skeleton file or image file not found.');
      }
    } else {
      vscode.window.showErrorMessage('No .atlas file selected.');
      console.error('No .atlas file selected.');
    }
  });

  let openWebviewDeveloperTools = vscode.commands.registerCommand('indrek-juhani.spine-player-vscode.openWebviewDeveloperTools', () => {
    if (currentPanel) {
      vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
    } else {
      vscode.window.showErrorMessage('No active webview found.');
    }
  });

  context.subscriptions.push(playSpineAnimation, openWebviewDeveloperTools);
}

export function deactivate() {
  console.log('Extension "indrek-juhani.spine-player-vscode" is now deactivated.');
}
