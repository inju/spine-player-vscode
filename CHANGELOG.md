# Change Log

All notable changes to the "spine-player-vscode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-23

### Added

- Added a custom marketplace icon built around a luminous Spine helix and atlas grid.

### Changed

- Updated the extension branding and release metadata.

## [1.1.2] - 2026-09-23

### Fixed

- Removed an invalid placeholder Explorer menu command that caused VS Code manifest warnings.

## [1.2.0] - 2026-09-23

### Added

- Full shared-atlas support, including multi-page PNG and WebP texture atlases.

### Changed

- Spine JSON files are now the primary activation point, while `.atlas` activation remains compatible.
- Added dynamic atlas selection and atlas-driven texture page resolution.

## [1.2.1] - 2026-09-23

### Fixed

- Made the Marketplace icon's rounded outer corners transparent instead of white.

## [1.2.2] - 2026-09-23

### Fixed

- Automatically select an atlas with the same base name as the selected JSON file.
- Show atlas selection only when no same-name atlas exists.

## [1.2.3] - 2026-09-23

### Fixed

- Start playback with the first animation that contains timeline data.
- Fall back to setup pose when no animation contains timelines.

## [1.2.4] - 2026-09-23

### Fixed

- Pass the first timeline animation to Spine Player before initialization so automatic viewport calculation does not run against an empty animation.
- When opening an atlas without a same-name JSON file, prompt for an available skeleton JSON file.

## [1.1.0] - 2026-09-23

### Added

- JSON-based activation as the primary entry point for Spine animation playback
- Dynamic atlas resolution for shared atlases used by multiple JSON files
- Automatic support for atlas textures stored as either `.png` or `.webp`
- Compatibility fallback for legacy `.atlas`-driven workflows

### Changed

- Switched from filename guessing to actual atlas-to-image resolution
- Updated the Explorer context menu to include `.json` assets and keep `.atlas` compatibility

## [0.0.1] - 2024-07-22

- Initial release