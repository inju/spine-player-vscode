import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWebviewContent } from './webviewContent';

const directoryEntriesCache = new Map<string, Promise<string[]>>();

type SpineAssetBundle = {
  jsonFilePath: string;
  atlasFilePath: string;
  imageFilePaths: string[];
  initialAnimation?: string;
};

async function getDirectoryEntries(directory: string): Promise<string[]> {
  let entries = directoryEntriesCache.get(directory);
  if (!entries) {
    entries = fs.promises.readdir(directory);
    directoryEntriesCache.set(directory, entries);
    const clearCache = () => {
      setTimeout(() => {
        if (directoryEntriesCache.get(directory) === entries) {
          directoryEntriesCache.delete(directory);
        }
      }, 1000);
    };
    void entries.then(clearCache, clearCache);
  }

  try {
    return await entries;
  } catch (error) {
    directoryEntriesCache.delete(directory);
    throw error;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function getCandidateAtlasFiles(jsonFilePath: string): Promise<string[]> {
  const directory = path.dirname(jsonFilePath);
  const fileName = path.basename(jsonFilePath, path.extname(jsonFilePath));
  const entries = await getDirectoryEntries(directory);
  const exactAtlasEntry = entries.find((entry) => entry.toLowerCase() === `${fileName.toLowerCase()}.atlas`);

  if (exactAtlasEntry) {
    return [path.join(directory, exactAtlasEntry)];
  }

  return entries
    .filter((entry) => entry.toLowerCase().endsWith('.atlas'))
    .map((entry) => path.join(directory, entry))
    .sort();
}

async function getAtlasImagePaths(atlasFilePath: string, atlasContent: string): Promise<string[]> {
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
    if (await fileExists(imagePath)) {
      imagePaths.add(path.normalize(imagePath));
    }
  }

  return Array.from(imagePaths);
}

async function getLegacyAtlasImagePaths(atlasFilePath: string): Promise<string[]> {
  const atlasDirectory = path.dirname(atlasFilePath);
  const atlasBaseName = path.basename(atlasFilePath, path.extname(atlasFilePath));
  const candidatePaths = new Set<string>();

  ['.png', '.webp'].forEach((extension) => {
    candidatePaths.add(path.join(atlasDirectory, `${atlasBaseName}${extension}`));
    candidatePaths.add(path.join(atlasDirectory, `${atlasBaseName}.atlas${extension}`));
  });

  const existingPaths = await Promise.all(
    Array.from(candidatePaths).map(async (candidate) => (await fileExists(candidate) ? candidate : undefined))
  );
  return existingPaths.filter((candidate): candidate is string => candidate !== undefined);
}

async function resolveAtlasImagePaths(atlasFilePath: string, atlasContent: string): Promise<string[]> {
  const referencedPaths = await getAtlasImagePaths(atlasFilePath, atlasContent);
  return referencedPaths.length ? referencedPaths : getLegacyAtlasImagePaths(atlasFilePath);
}

function resolveInitialAnimation(jsonContent: string): string | undefined {
  const skeletonData = JSON.parse(jsonContent) as {
    animations?: Record<string, Record<string, unknown>>;
  };

  return Object.entries(skeletonData.animations ?? {})
    .find(([, animation]) => Object.keys(animation).length > 0)?.[0];
}

async function resolveSpineAssetsFromJson(jsonFilePath: string): Promise<SpineAssetBundle | undefined> {
  const [atlasCandidates, jsonContent] = await Promise.all([
    getCandidateAtlasFiles(jsonFilePath),
    fs.promises.readFile(jsonFilePath, 'utf8'),
  ]);

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

  const atlasContent = await fs.promises.readFile(atlasFilePath, 'utf8');
  const imageFilePaths = await resolveAtlasImagePaths(atlasFilePath, atlasContent);
  if (!imageFilePaths.length) {
    return undefined;
  }

  return {
    jsonFilePath,
    atlasFilePath,
    imageFilePaths,
    initialAnimation: resolveInitialAnimation(jsonContent),
  };
}

async function resolveJsonPathForAtlas(atlasFilePath: string): Promise<string | undefined> {
  const directory = path.dirname(atlasFilePath);
  const atlasBaseName = path.basename(atlasFilePath, path.extname(atlasFilePath));
  const entries = await getDirectoryEntries(directory);
  const exactJsonEntry = entries.find((entry) => entry.toLowerCase() === `${atlasBaseName.toLowerCase()}.json`);

  if (exactJsonEntry) {
    return path.join(directory, exactJsonEntry);
  }

  const jsonCandidates = entries
    .filter((entry) => entry.toLowerCase().endsWith('.json'))
    .sort()
    .map((entry) => path.join(directory, entry));

  if (jsonCandidates.length === 1) {
    return jsonCandidates[0];
  }

  if (!jsonCandidates.length) {
    return undefined;
  }

  return vscode.window.showQuickPick(
    jsonCandidates.map((jsonPath) => ({
      label: path.basename(jsonPath),
      description: path.dirname(jsonPath),
      detail: jsonPath,
    })),
    {
      placeHolder: 'Select the skeleton JSON file to use with this atlas',
      ignoreFocusOut: true,
    }
  ).then((selection) => selection?.detail);
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

  const panel = vscode.window.createWebviewPanel(
    'spinePlayer',
    'Spine Player',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      localResourceRoots: []
    }
  );
  let disposed = false;
  panel.onDidDispose(() => {
    disposed = true;
  });

  panel.webview.html = '<!DOCTYPE html><html><body style="background:#1e1e1e;color:#ccc;font-family:sans-serif;padding:1rem">Loading Spine assets…</body></html>';

  try {
    const ext = path.extname(selectedUri.fsPath).toLowerCase();
    const jsonFilePath = ext === '.atlas'
      ? await resolveJsonPathForAtlas(selectedUri.fsPath)
      : selectedUri.fsPath;

    if (!jsonFilePath || !(await fileExists(jsonFilePath))) {
      throw new Error('Selected Spine file does not contain an animation JSON.');
    }

    const resolvedBundle = ext === '.atlas'
      ? await (async () => {
          const jsonContent = await fs.promises.readFile(jsonFilePath, 'utf8');
          const atlasContent = await fs.promises.readFile(selectedUri.fsPath, 'utf8');
          return {
            jsonFilePath,
            atlasFilePath: selectedUri.fsPath,
            imageFilePaths: await resolveAtlasImagePaths(selectedUri.fsPath, atlasContent),
            initialAnimation: resolveInitialAnimation(jsonContent),
          };
        })()
      : await resolveSpineAssetsFromJson(jsonFilePath);

    if (!resolvedBundle || !(await fileExists(resolvedBundle.atlasFilePath)) || !resolvedBundle.imageFilePaths.length) {
      throw new Error('No matching .atlas file or image could be resolved for the selected Spine JSON.');
    }

    if (disposed) {
      return;
    }

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: Array.from(new Set([
        path.dirname(resolvedBundle.atlasFilePath),
        ...resolvedBundle.imageFilePaths.map((imagePath) => path.dirname(imagePath)),
      ])).map((directory) => vscode.Uri.file(directory))
    };
    panel.webview.html = getWebviewContent(
      resolvedBundle.atlasFilePath,
      resolvedBundle.jsonFilePath,
      resolvedBundle.initialAnimation,
      panel.webview
    );
  } catch (error) {
    if (disposed) {
      return;
    }

    const message = error instanceof Error ? error.message : 'Unable to resolve Spine assets.';
    panel.webview.html = `<!DOCTYPE html><html><body style="background:#1e1e1e;color:#f48771;font-family:sans-serif;padding:1rem">${message}</body></html>`;
    vscode.window.showErrorMessage(message);
    console.error(message, error);
  }
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
