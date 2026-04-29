import * as vscode from 'vscode';

interface LineHeat {
    lastTouched: number;
}

function findContainingSymbol(
    line: number,
    symbols: vscode.DocumentSymbol[]
): vscode.DocumentSymbol | null {
    for (const symbol of symbols) {
        if (symbol.range.start.line <= line && symbol.range.end.line >= line) {
            const childResult = findContainingSymbol(line, symbol.children);
            if (childResult && childResult.range.start.line === childResult.range.end.line) {
                return symbol;
            }
            return childResult || symbol;
        }
    }
    return null;
}

export class HeatmapEngine {
    private lineData: Map<string, Map<number, LineHeat>> = new Map();
    private decoration: { maxAge: number; type: vscode.TextEditorDecorationType }[];
    private timer: NodeJS.Timeout | undefined;
    private cursorLines: Set<number> = new Set();

    constructor() {
        this.decoration = [
            {
                maxAge: 0.33,
                type: vscode.window.createTextEditorDecorationType({
                    opacity: '0.75',
                    isWholeLine: true,
                }),
            },
            {
                maxAge: 0.66,
                type: vscode.window.createTextEditorDecorationType({
                    opacity: '0.5',
                    isWholeLine: true,
                }),
            },
            {
                maxAge: 1,
                type: vscode.window.createTextEditorDecorationType({
                    opacity: '0.25',
                    isWholeLine: true,
                }),
            },
            {
                maxAge: Infinity,
                type: vscode.window.createTextEditorDecorationType({
                    opacity: '0.25',
                    isWholeLine: true,
                }),
            }
        ];
    }

    async touch(editor: vscode.TextEditor, lines: number[]) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) { this.lineData.set(name, new Map()); }

        await this.refresh(editor, lines);
    }

    setCursorLines(lines: number[]) {
        this.cursorLines = new Set(lines);
    }

    async refresh(editor: vscode.TextEditor, currentLines?: number[]) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) { return; }
        const fileMap = this.lineData.get(name)!;
        const dimAfter = (vscode.workspace.getConfiguration('deeper').get<number>('dimAfter') || 3) * 60_000;
        const maxFocusRange = vscode.workspace.getConfiguration('deeper').get<number>('maxFocusRange') || 10;

        const now = Date.now();
        const tierRanges: vscode.Range[][] = this.decoration.map(() => []);

        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            editor.document.uri
        );

        const visibleLines: Set<number> = new Set();
        for (const line of currentLines || []) {
            const symbol = findContainingSymbol(line, symbols || []);
            if (symbol && symbol.range.start.line !== symbol.range.end.line) {
                for (let l = Math.max(symbol.range.start.line, findContainingSymbol(line - maxFocusRange, symbols || [])?.range.start.line ?? line - maxFocusRange); l <= Math.min(symbol.range.end.line, findContainingSymbol(line + maxFocusRange, symbols || [])?.range.end.line ?? line + maxFocusRange); l++) {
                    visibleLines.add(l);
                    fileMap.set(l, { lastTouched: now });
                }
            } else {
                for (let l = Math.max(0, findContainingSymbol(line - maxFocusRange, symbols || [])?.range.start.line ?? line - maxFocusRange); l <= Math.min(editor.document.lineCount - 1, findContainingSymbol(line + maxFocusRange, symbols || [])?.range.end.line ?? line + maxFocusRange); l++) {
                    visibleLines.add(l);
                    fileMap.set(l, { lastTouched: now });
                }
            }
        }
        if (visibleLines.size > 0) {
            for (const l of this.cursorLines || []) {
                fileMap.set(l, { lastTouched: now });
            }
            this.setCursorLines([...visibleLines]);
        }

        for (let i = 0; i < editor.document.lineCount; i++) {
            if (this.cursorLines.has(i)) { continue; }

            const heat = fileMap.get(i);
            const age = heat ? (now - heat.lastTouched) / dimAfter : Infinity;

            const tierIndex = this.decoration.findIndex(d => age <= d.maxAge);
            if (tierIndex >= 0) {
                tierRanges[tierIndex].push(editor.document.lineAt(i).range);
            }
        }

        for (let i = 0; i < this.decoration.length; i++) {
            editor.setDecorations(this.decoration[i].type, tierRanges[i]);
        }
    }

    async startAutoRefresh(editor: vscode.TextEditor) {
        clearInterval(this.timer!);
        this.timer = setInterval(() => this.refresh(editor), (vscode.workspace.getConfiguration('deeper').get<number>('refreshInterval') || 5) * 1_000);
    }

    dispose() {
        clearInterval(this.timer!);
        this.decoration.forEach(d => d.type.dispose());
    }
}