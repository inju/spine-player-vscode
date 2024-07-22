import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewContent } from './webviewContent';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "inju.spine-player-vscode" is now active.');

  let playSpineAnimation = vscode.commands.registerCommand('inju.spine-player-vscode.playSpineAnimation', async (uri: vscode.Uri) => {

    if (uri && uri.fsPath) {
      const atlasFilePath = uri.fsPath;
      const jsonFilePath = atlasFilePath.replace('.atlas', '.json');
      const imageFilePath = atlasFilePath.replace('.atlas', '.png'); // Assuming image file has the same name base as the atlas

      if (fs.existsSync(jsonFilePath) && fs.existsSync(imageFilePath)) {
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
      } else {
        vscode.window.showErrorMessage('Corresponding JSON skeleton file or image file not found.');
        console.error('Corresponding JSON skeleton file or image file not found.');
      }
    } else {
      vscode.window.showErrorMessage('No .atlas file selected.');
      console.error('No .atlas file selected.');
    }
  });

  context.subscriptions.push(playSpineAnimation);
}

export function deactivate() {
  console.log('Extension "inju.spine-player-vscode" is now deactivated.');
}
