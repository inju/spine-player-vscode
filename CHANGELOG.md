# Change Log

All notable changes to the "spine-player-vscode" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-23

### Added

- Added a custom marketplace icon built around a luminous Spine helix and atlas grid.

### Changed

- Updated the extension branding and release metadata.

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