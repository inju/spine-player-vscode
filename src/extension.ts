import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewContent } from './webviewContent';

let currentPanel: vscode.WebviewPanel | undefined = undefined;

type SpineAssetBundle = {
  jsonFilePath: string;
  atlasFilePath: string;
  imageFilePaths: string[];
};

function getCandidateAtlasFiles(jsonFilePath: string): string[] {
  const directory = path.dirname(jsonFilePath);
  const fileName = path.basename(jsonFilePath, '.json');
  const exactAtlasPath = path.join(directory, `${fileName}.atlas`);
  const files = fs.existsSync(directory)
    ? fs.readdirSync(directory)
        .filter((entry) => entry.toLowerCase().endsWith('.atlas'))
        .map((entry) => path.join(directory, entry))
        .sort()
    : [];

  return Array.from(new Set([...(fs.existsSync(exactAtlasPath) ? [exactAtlasPath] : []), ...files.filter((file) => file !== exactAtlasPath)]));
}

function getAtlasImagePaths(atlasFilePath: string): string[] {
  const atlasContent = fs.readFileSync(atlasFilePath, 'utf8');
  const atlasDirectory = path.dirname(atlasFilePath);
  const imagePaths = new Set<string>();

  for (const line of atlasContent.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.includes(':')) {
      continue;
    }

    const extension = path.extname(trimmed).toLowerCase();
    if (extension !== '.png' && extension !== '.webp') {
      continue;
    }

    const imagePath = path.isAbsolute(trimmed)
      ? trimmed
      : path.join(atlasDirectory, trimmed);
    if (fs.existsSync(imagePath)) {
      imagePaths.add(path.normalize(imagePath));
    }
  }

  return Array.from(imagePaths);
}

function getLegacyAtlasImagePaths(atlasFilePath: string): string[] {
  const atlasDirectory = path.dirname(atlasFilePath);
  const atlasBaseName = path.basename(atlasFilePath, path.extname(atlasFilePath));
  const candidatePaths = new Set<string>();

  ['.png', '.webp'].forEach((extension) => {
    candidatePaths.add(path.join(atlasDirectory, `${atlasBaseName}${extension}`));
    candidatePaths.add(path.join(atlasDirectory, `${atlasBaseName}.atlas${extension}`));
  });

  return Array.from(candidatePaths).filter((candidate) => fs.existsSync(candidate));
}

function resolveAtlasImagePaths(atlasFilePath: string): string[] {
  const referencedPaths = getAtlasImagePaths(atlasFilePath);
  return referencedPaths.length ? referencedPaths : getLegacyAtlasImagePaths(atlasFilePath);
}

async function resolveSpineAssetsFromJson(jsonFilePath: string): Promise<SpineAssetBundle | undefined> {
  const atlasCandidates = getCandidateAtlasFiles(jsonFilePath);

  if (!atlasCandidates.length) {
    return undefined;
  }

  const atlasFilePath = atlasCandidates.length === 1
    ? atlasCandidates[0]
    : await vscode.window.showQuickPick(
        atlasCandidates.map((atlasPath) => ({ label: path.basename(atlasPath), description: path.dirname(atlasPath), detail: atlasPath })),
        {
          placeHolder: 'Select the atlas file to use for this animation JSON',
          ignoreFocusOut: true,
        }
      ).then((selection) => selection?.detail ?? undefined);

  if (!atlasFilePath) {
    return undefined;
  }

  const imageFilePaths = resolveAtlasImagePaths(atlasFilePath);
  if (!imageFilePaths.length) {
    return undefined;
  }

  return {
    jsonFilePath,
    atlasFilePath,
    imageFilePaths,
  };
}

async function openSpinePlayer(uri?: vscode.Uri) {
  const selectedUri = uri ?? (await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: false,
    filters: {
      'Spine JSON': ['json'],
      'All files': ['*']
    }
  }))?.[0];

  if (!selectedUri || !selectedUri.fsPath) {
    vscode.window.showErrorMessage('No Spine animation JSON selected.');
    console.error('No Spine animation JSON selected.');
    return;
  }

  const ext = path.extname(selectedUri.fsPath).toLowerCase();
  const jsonFilePath = ext === '.atlas'
    ? selectedUri.fsPath.replace(/\.atlas$/i, '.json')
    : selectedUri.fsPath;

  if (!fs.existsSync(jsonFilePath) && ext !== '.json') {
    vscode.window.showErrorMessage('Selected Spine file does not contain an animation JSON.');
    console.error('Selected Spine file does not contain an animation JSON.');
    return;
  }

  const assetBundle = ext === '.atlas'
    ? {
        jsonFilePath: jsonFilePath,
        atlasFilePath: selectedUri.fsPath,
        imageFilePaths: resolveAtlasImagePaths(selectedUri.fsPath),
      }
    : await resolveSpineAssetsFromJson(jsonFilePath);

  if (!assetBundle || !fs.existsSync(assetBundle.jsonFilePath) || !fs.existsSync(assetBundle.atlasFilePath) || !assetBundle.imageFilePaths.length) {
    vscode.window.showErrorMessage('No matching .atlas file or image could be resolved for the selected Spine JSON.');
    console.error('No matching .atlas file or image could be resolved for the selected Spine JSON.');
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'spinePlayer',
    'Spine Player',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: Array.from(new Set([
        path.dirname(assetBundle.atlasFilePath),
        ...assetBundle.imageFilePaths.map((imagePath) => path.dirname(imagePath)),
      ])).map((directory) => vscode.Uri.file(directory))
    }
  );

  currentPanel.webview.html = getWebviewContent(
    assetBundle.atlasFilePath,
    assetBundle.jsonFilePath,
    currentPanel.webview
  );
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "inju.spine-player-vscode" is now active.');

  const playSpineAnimation = vscode.commands.registerCommand('inju.spine-player-vscode.playSpineAnimation', async (uri?: vscode.Uri) => {
    await openSpinePlayer(uri);
  });

  context.subscriptions.push(playSpineAnimation);
}

export function deactivate() {
  console.log('Extension "inju.spine-player-vscode" is now deactivated.');
}
