import * as vscode from 'vscode';

interface LineHeat {
    lastTouched: number;
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

    touch(editor: vscode.TextEditor, lines: number[]) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) this.lineData.set(name, new Map());
        const fileMap = this.lineData.get(name)!;

        const now = Date.now();
        for (const line of lines) {
            fileMap.set(line, { lastTouched: now });
        }
        this.refresh(editor);
    }

    refresh(editor: vscode.TextEditor) {
        const name = editor.document.fileName;
        if (!this.lineData.has(name)) return;
        const fileMap = this.lineData.get(name)!;
        const dimAfter = (vscode.workspace.getConfiguration('deeper').get<number>('dimAfter') || 1) * 1_000;

        const now = Date.now();
        const ranges: vscode.Range[] = [];
        for (let i = 0; i < editor.document.lineCount; i++) {
            const heat = fileMap.get(i);
            const age = heat ? now - heat.lastTouched : Infinity;
            if (age > dimAfter) {
                ranges.push(editor.document.lineAt(i).range);
            }
        }
        editor.setDecorations(this.decoration, ranges);
    }

    startAutoRefresh(editor: vscode.TextEditor) {
        clearInterval(this.timer!);
        this.timer = setInterval(() => this.refresh(editor), 60_000);
    }

    dispose() {
        clearInterval(this.timer!);
        this.decoration.dispose();
    }
}