// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { HeatmapEngine } from './heatmap';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const heatmap = new HeatmapEngine();
	if (vscode.window.activeTextEditor) { await heatmap.startAutoRefresh(vscode.window.activeTextEditor); }

	context.subscriptions.push(
		vscode.window.onDidChangeTextEditorSelection(async e => {
			const lines = e.selections.map(s => s.active.line);
			await heatmap.touch(e.textEditor, lines);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(async e => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document !== e.document) { return; }
			const lines = e.contentChanges.map(c => c.range.start.line);
			await heatmap.touch(editor, lines);
		})
	);

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(async e => {
			if (!e) { return; }
			await heatmap.startAutoRefresh(e);
		})
	);

	context.subscriptions.push(heatmap);
}

// This method is called when your extension is deactivated
export function deactivate() { }
