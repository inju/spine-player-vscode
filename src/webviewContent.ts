import * as vscode from 'vscode';
import * as fs from 'fs';

export function getWebviewContent(atlasFilePath: string, jsonFilePath: string, imageFilePath: string, webview: vscode.Webview): string {
  const atlasBlobUrl = webview.asWebviewUri(vscode.Uri.file(atlasFilePath)).toString();
  const jsonBlobUrl = webview.asWebviewUri(vscode.Uri.file(jsonFilePath)).toString();
  const imageBlobUrl = webview.asWebviewUri(vscode.Uri.file(imageFilePath)).toString();

  const csp = `
    default-src 'none';
    img-src 'self' vscode-resource: data: blob: https:;
    script-src 'unsafe-inline' 'unsafe-eval' vscode-resource: https://unpkg.com;
    style-src 'unsafe-inline' https://unpkg.com;
    connect-src vscode-resource: https: blob:;`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Spine Player</title>
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <style>
      body, html {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #1e1e1e;
      }
      #spine-container {
        width: 100%;
        height: 100%;
      }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/spine-player.css">
  </head>
  <body>
    <div id="spine-container"></div>
    <script src="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/iife/spine-player.js"></script>
    <script>
      window.addEventListener('load', function () {
        const checkSpine = setInterval(() => {
          if (typeof spine !== 'undefined' && typeof spine.SpinePlayer !== 'undefined') {
            clearInterval(checkSpine);

            try {
              const player = new spine.SpinePlayer('spine-container', {
                jsonUrl: '${jsonBlobUrl}',
                atlasUrl: '${atlasBlobUrl}',
                imageUrl: '${imageBlobUrl}',
                fitToCanvas: true,
                success: function (player) {
                  if (player.skeletonData) {
                    if (player.skeletonData.animations.length > 0) {
                      const animations = player.skeletonData.animations.map(anim => anim.name);
                      const animationName = animations.includes('animation') ? 'animation' : animations[0];
                      player.state.setAnimation(0, animationName, true);
                    }
                  }
                },
                error: function (error) {
                  console.error('Error initializing Spine Player:', error);
                }
              });
            } catch (error) {
              console.error('Exception initializing Spine Player:', error);
            }
          }
        }, 100);
      });

      window.addEventListener('message', event => {
        const message = event.data;
        if (message.command === 'openDevTools') {
          console.log('Opening developer tools');
        }
      });
    </script>
  </body>
  </html>`;
}
