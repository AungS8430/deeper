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
            if (childResult && childResult.range.start.line == childResult.range.end.line) {
                return symbol;
            }
            if (childResult && childResult.range.start.line == childResult.range.end.line) {
                return symbol;
            }
            return childResult || symbol;
        }
    }
    return null;
}

export class HeatmapEngine {
    private lineData: Map<string, Map<number, LineHeat>> = new Map();
    private decoration: vscode.TextEditorDecorationType;
    private timer: NodeJS.Timeout | undefined;

    constructor() {
        this.decoration = vscode.window.createTextEditorDecorationType({
            opacity: '0.35',
            isWholeLine: true,
        });
    }

    async touch(editor: vscode.TextEditor, lines: number[]) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) this.lineData.set(name, new Map());
        const fileMap = this.lineData.get(name)!;

        const now = Date.now();
        for (const line of lines) {
            fileMap.set(line, { lastTouched: now });
        }
        await this.refresh(editor);
    }

    async refresh(editor: vscode.TextEditor) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) return;
        const fileMap = this.lineData.get(name)!;
        const dimAfter = (vscode.workspace.getConfiguration('deeper').get<number>('dimAfter') || 1) * 1_000;
        const maxFocusRange = vscode.workspace.getConfiguration('deeper').get<number>('maxFocusRange') || 20;

        const now = Date.now();
        const ranges: vscode.Range[] = [];
        const hotLines: Set<number> = new Set();
        for (const [line, heat] of fileMap.entries()) {
            if (now - heat.lastTouched <= dimAfter) {
                hotLines.add(line);
            }
        }

        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            editor.document.uri
        )

        const visibleLines: Set<number> = new Set();
        for (const line of hotLines) {
            const symbol = findContainingSymbol(line, symbols || []);
            if (symbol && symbol.range.start.line != symbol.range.end.line) {
                for (let l = Math.max(symbol.range.start.line, findContainingSymbol(line - maxFocusRange, symbols || [])?.range.start.line ?? line - maxFocusRange); l <= Math.min(symbol.range.end.line, findContainingSymbol(line + maxFocusRange, symbols || [])?.range.end.line ?? line + maxFocusRange); l++) {
                    visibleLines.add(l);
                }
            } else {
                for (let l = Math.max(0, findContainingSymbol(line - maxFocusRange, symbols || [])?.range.start.line ?? line - maxFocusRange); l <= Math.min(editor.document.lineCount - 1, findContainingSymbol(line + maxFocusRange, symbols || [])?.range.end.line ?? line + maxFocusRange); l++) {
                    visibleLines.add(l);
                }
            }
        }

        for (let i = 0; i < editor.document.lineCount; i++) {
            if (!visibleLines.has(i)) {
                ranges.push(editor.document.lineAt(i).range);
            }
        }
        editor.setDecorations(this.decoration, ranges);
    }

    async startAutoRefresh(editor: vscode.TextEditor) {
        clearInterval(this.timer!);
        this.timer = setInterval(() => this.refresh(editor), 60_000);
    }

    dispose() {
        clearInterval(this.timer!);
        this.decoration.dispose();
    }
}