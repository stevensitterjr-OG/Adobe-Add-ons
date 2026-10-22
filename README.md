# Local Upscale for Adobe Photoshop

A UXP panel that upscales the active document locally with Photoshop's native Image Size engine. Built for Windows 11, including systems with an NVIDIA GeForce RTX 3060. Requires Photoshop 2023 (24.0) or newer. No external server, Python runtime, API key, uploads, or model download is needed on your Windows machine.

## Features

- 2×, 4×, and 6× presets, arbitrary multipliers, or a target width/height with proportional sizing.
- Preserve Details 2.0 with noise reduction; Bicubic Smoother; Nearest Neighbor for pixel art.
- Duplicate document by default, preserving the original. Photoshop resizes the whole document, retaining layers and scaling layer styles.
- Output pixel dimensions and megapixel estimate, dimension limits, and one undo history step for resizing.

This uses Adobe's native resampling. It does not include a separate generative or Real-ESRGAN model, and cannot recover true detail missing from the source. Large output sizes require substantial RAM, scratch disk, and processing time. Smart Object contents keep their source resolution.

## Install on Windows 11

1. Install or update Photoshop to version 24.0 or newer.
2. Install **UXP Developer Tool** through Adobe Creative Cloud Desktop (look under All apps). Enable Developer Mode in the tool. If your Photoshop version exposes a separate **Enable Developer Mode** option under Edit → Preferences → Plugins, enable it and restart Photoshop.
3. Download this repository, or extract `dist/local-upscale.zip` after building the ZIP. Keep all panel files together.
4. In UXP Developer Tool, click **Add Plugin** and select `plugin/manifest.json` (or `manifest.json` in the extracted ZIP).
5. Open Photoshop, then click **Load** beside Local Upscale in UXP Developer Tool. Open the panel through **Plugins → Local Upscale** if it is not already visible.
6. Open an image, choose settings, keep **Create a duplicate document** checked, and click **Upscale image**. Save the result with Photoshop's usual Save As command.

The ZIP is a developer bundle, not a signed, double-click-installable CCX package. Adobe's developer tool is required for this installation path. Developer-loaded plugins may need loading again after restarting Photoshop.

## Create the ZIP on Windows 11 (no Node or Python required)

Download this repository from GitHub using **Code → Download ZIP**, then extract it. Open PowerShell in the extracted repository folder and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\package.ps1
```

This bypass applies only to that PowerShell process; it does not change your saved execution policy. If your organization blocks script execution, use the direct command below instead of changing policy.

The script creates `dist\local-upscale.zip`. Alternatively, run this built-in PowerShell command from the repository folder:

```powershell
New-Item -ItemType Directory -Path .\dist -Force | Out-Null
Compress-Archive -Path .\plugin\* -DestinationPath .\dist\local-upscale.zip -Force
```

The archive must contain `manifest.json`, `index.html`, `style.css`, `panel.js`, and `upscale.js` directly at its root. Extract it before loading `manifest.json` in UXP Developer Tool. You can also load `plugin\manifest.json` directly from the repository without creating another ZIP. Renaming a ZIP to `.ccx` does not produce an Adobe installation package.

## RTX 3060 settings

In **Edit → Preferences → Performance**, confirm Photoshop detects **NVIDIA GeForce RTX 3060** and enable **Use Graphics Processor**. Keep the NVIDIA Studio driver up to date. If Photoshop exposes **Enable Preserve Details 2.0 Upscale** under Technology Previews, enable it and restart Photoshop.

Photoshop decides CPU/GPU scheduling and VRAM usage; UXP cannot force CUDA, select the GPU, or guarantee that every resampling step uses it. A disabled or unsupported GPU can affect available features and performance. If Preserve Details 2.0 fails for your document or Photoshop configuration, choose Bicubic Smoother. Some document modes/bit depths may require converting a duplicate to RGB, 8 or 16 bits/channel, using Photoshop's Image → Mode menu.

## Development and checks

No npm dependencies are required. Use the existing checkout; a separate Git worktree is unnecessary.

```sh
npm test
npm run package
```

Packaging requires Python 3 on the development machine (`python3` on Linux/macOS; on Windows run `py scripts/package.py`). Load `plugin/manifest.json` using Adobe's developer tool and use Reload after edits. Its Debug action opens the panel debugger.

Automated checks cover size planning, aspect ratios, invalid/oversized inputs, method-specific Photoshop command descriptors, and manifest wiring. They do not execute Photoshop. Photoshop is unavailable in the Linux development environment, so host integration and hardware acceleration remain unverified until tested in Photoshop on Windows.

## Photoshop acceptance checks

1. Open a layered 1000 × 500 RGB document. Upscale 2× with the duplicate option. Verify the output is 2000 × 1000, the source remains 1000 × 500, and layers remain present.
2. Repeat with a target width of 3000; verify 3000 × 1500. Repeat using Bicubic Smoother and Nearest Neighbor.
3. Test Preserve Details 2.0 with noise reduction at 0 and 100. Inspect edges and noise at 100% zoom.
4. Disable the duplicate option on a disposable document, upscale, then press Ctrl+Z. Verify original dimensions return in one undo.
5. Switch documents and close all documents. Use Refresh if the panel is stale; Upscale should disable without an image. Invalid and oversized dimensions must not run.
6. Try a large image and a mode unsupported by Preserve Details 2.0. Confirm errors are visible, the original stays intact with duplicate enabled, and Bicubic Smoother works where supported.

## Privacy

The plugin declares no network or filesystem permissions. Processing stays in Photoshop. Nothing is saved automatically, and no telemetry is collected by the plugin.

## Updating from version 1.0.0

Version 1.0.1 fixes clipped controls in short floating panels: settings scroll independently, while the Upscale button, output dimensions, and status stay at the bottom. The button changes to “Upscaling…” during processing. No percentage estimate is shown because Photoshop's native resize does not provide one through this command.

Download and extract the latest source, then unload the old plugin in UXP Developer Tool. If you extracted to a new folder, remove the old tool entry and add the new `plugin/manifest.json`; otherwise use Reload. Open Local Upscale in Photoshop. Enlarge the floating panel by dragging its lower edge if necessary. Choose 2× and click Upscale image. For a 1152 × 626 source, success should report 2304 × 1252 pixels and open a duplicate when that option is checked. Verify dimensions using Image → Image Size; the canvas zoom percentage alone does not indicate output resolution.
