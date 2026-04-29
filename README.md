# deeper

deeper is a small Visual Studio Code extension that focuses the current function or logical section and dims the rest of the file so developers like you and I can concentrate while editing large files.

## Features

- Focuses the active function/section and visually dims other regions.
- Updates automatically when you change the cursor, selection, or active editor.
- Minimal configuration — designed to be unobtrusive while you work.

## Usage

The extension activates automatically when you edit files or change selections. It detects the current function or nearest structural block and highlights it while applying a subtle dimming overlay to other text, helping you stay focused on the current context.

Development / local testing:

1. Install dependencies: `pnpm install`
2. Compile TypeScript: `pnpm run compile`
3. Launch the extension in a Development Host: press `F5` in VS Code.

## Development

- Entry point: `src/extension.ts`
- Core logic: `src/heatmap.ts` (responsible for detecting sections and applying decorations)
- Build: `pnpm run compile`

## Packaging & Publishing

To package a VSIX locally use `pnpm exec vsce package --no-dependencies`.

## License

See the license specified in `LICENSE`.

---

For more details see the VS Code extension API documentation.
