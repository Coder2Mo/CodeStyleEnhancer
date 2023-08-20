import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { LintingResult, parseLintingResults } from './lintingResult';

let bracketPairDecorationType: vscode.TextEditorDecorationType;
let openingBrackets: string[];
let closingBrackets: string[];
let config: vscode.WorkspaceConfiguration;

function findMatchingOpeningBracket(
    editor: vscode.TextEditor,
    position: vscode.Position,
    currentChar: string,
    openingChar: string,
    closingChar: string
): vscode.Position | null {
    const currentLine = editor.document.lineAt(position.line).text;
    const lineCount = editor.document.lineCount;
    let openBracketCount = 0;

    for (let lineIndex = position.line; lineIndex >= 0; lineIndex--) {
        const lineText = editor.document.lineAt(lineIndex).text;

        for (let charIndex = lineText.length - 1; charIndex >= 0; charIndex--) {
            const char = lineText.charAt(charIndex);

            if (char === openingChar) {
                openBracketCount++;
            } else if (char === closingChar) {
                if (openBracketCount === 0) {
                    return new vscode.Position(lineIndex, charIndex);
                } else {
                    openBracketCount--;
                }
            }
        }
    }

    return null;
}

async function runLinting(document: vscode.TextDocument): Promise<LintingResult[]> {
  return new Promise((resolve, reject) => {
      const lintingTool = vscode.workspace.getConfiguration().get('autoCloseBracketsEnhanced.lintingTool', 'eslint');
      const lintingProcess = spawn(lintingTool, [document.uri.fsPath, '--format=json'], { shell: true });

      let lintingOutput = '';
    lintingProcess.stdout.on('data', (data: Buffer) => {
        lintingOutput += data.toString();
    });

    lintingProcess.on('close', async code => {
        if (code === 0) {
            const rawLintingResults: any[] = JSON.parse(lintingOutput);
            const lintingResults = await parseLintingResults(rawLintingResults);
            resolve(lintingResults);
        } else {
            reject(new Error('Linting failed'));
        }
      });
  });
}

async function findMatchingClosingBracket(
    editor: vscode.TextEditor,
    position: vscode.Position,
    currentChar: string,
    openingChar: string,
    closingChar: string
): Promise<vscode.Position | null> {
    if (editor) {
        const currentPosition = editor.selection.active;
        const currentLine = editor.document.lineAt(currentPosition.line).text;
        const lintingEnabled = vscode.workspace.getConfiguration().get('autoCloseBracketsEnhanced.lintingEnabled', true);

        if (lintingEnabled) {
          try {
              const lintingResults = await runLinting(editor.document);
  
              for (const lintingResult of lintingResults) {
                  console.log('Linting Result:', lintingResult);
                  // You can process the linting results here and use the information as needed
              }
  
          } catch (error) {
              console.error('Linting failed:', (error as Error).message);
          }
      }

        return null;
    }

    return null;
}

async function findMatchingBracket(editor: vscode.TextEditor, position: vscode.Position): Promise<vscode.Position | null> {
    const currentChar = editor.document.getText(new vscode.Range(position, position.translate(0, 1)));
    const openingIndex = openingBrackets.indexOf(currentChar);
    const closingIndex = closingBrackets.indexOf(currentChar);

    if (openingIndex !== -1) {
        return await findMatchingClosingBracket(editor, position, currentChar, openingBrackets[openingIndex], closingBrackets[openingIndex]);
    } else if (closingIndex !== -1) {
        return await findMatchingOpeningBracket(editor, position, currentChar, openingBrackets[closingIndex], closingBrackets[closingIndex]);
    }

    return null;
}

let braceWrapDisposable: vscode.Disposable;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Enhanced Auto Close Brackets extension is now active.');

    config = vscode.workspace.getConfiguration('autoCloseBracketsEnhanced');
    openingBrackets = ['(', '[', '{'];
    closingBrackets = [')', ']', '}'];

    bracketPairDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(100, 100, 255, 0.3)',
    });

    braceWrapDisposable = vscode.commands.registerCommand('extension.braceWrap', async () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const selections = editor.selections;
            const closingBracket = '}';

            editor.edit(editBuilder => {
                selections.forEach(selection => {
                    const startPos = selection.start;
                    const endPos = selection.end;
                    const indentation = editor.document.lineAt(startPos.line).text.match(/^\s*/)![0];

                    editBuilder.insert(startPos, '{');
                    editBuilder.insert(endPos, `${indentation}${closingBracket}`);
                });
            });
        }
    });

    const matchingBracketDecoration = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'yellow', // You can choose a suitable color
    });

    let disposable = vscode.commands.registerCommand('extension.autoCloseBracketsEnhanced', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return;
        }

        const config = vscode.workspace.getConfiguration('autoCloseBracketsEnhanced');
        const autoCloseInsideComments = config.get('autoCloseInsideComments', false);

        const position = editor.selection.active;
        const currentLine = editor.document.lineAt(position.line).text;
        const isInsideString = currentLine.slice(0, position.character).includes('"') && currentLine.slice(position.character).includes('"');
        const isInsideComment = currentLine.trim().startsWith('//');

        if ((!/\}$/.test(currentLine) || autoCloseInsideComments) &&
            !isInsideString &&
            (!isInsideComment || autoCloseInsideComments)
        ) {
            const openingBracketPosition = findMatchingOpeningBracket(editor, position, currentLine, '{', '}');

            if (openingBracketPosition) {
                editor.setDecorations(matchingBracketDecoration, [new vscode.Range(openingBracketPosition, openingBracketPosition.translate(0, 1))]);
            } else {
                editor.setDecorations(matchingBracketDecoration, []);
            }
        }

        const autoCloseInMarkdownCodeBlocks = config.get('autoCloseBracketsEnhanced.autoCloseInMarkdownCodeBlocks', true);

        if (!/\}$/.test(currentLine) && !isInsideString && !isInsideComment) {
            const languageId = editor.document.languageId;

            function isInsideMarkdownCodeBlock(document: vscode.TextDocument, position: vscode.Position): boolean {
                const lineText = document.lineAt(position.line).text;
                return lineText.trim() === '```';
            }

            function determineClosingBracketForMarkdown(document: vscode.TextDocument, position: vscode.Position): string | undefined {
                return '```';
            }

            if (autoCloseInMarkdownCodeBlocks && isInsideMarkdownCodeBlock(editor.document, position)) {
                const closingBracketText = determineClosingBracketForMarkdown(editor.document, position);
                if (closingBracketText) {
                    editor.edit(editBuilder => {
                        editBuilder.insert(position, closingBracketText);
                    });
                }
            }
        }

        const languageRules: Record<string, string> = {
            'javascript': 'sameLine',
            'typescript': 'newLineAfter',
            // Add more languages and rules as needed
        };

        const languageId = editor.document.languageId;
        const languageSpecificRule = vscode.workspace.getConfiguration('autoCloseBracketsEnhanced').get(`languageRules.${languageId}`, languageRules[languageId]);
        const autoCloseFormatting = languageSpecificRule || 'sameLine';

        const autoCloseEnabled = config.get('autoCloseEnabled', true);
        const autoCloseOtherBrackets = config.get('autoCloseOtherBrackets', true);
        const autoCloseSmart = config.get('autoCloseSmart', true);
        const customTriggers = config.get('customTriggers', ['{']);

        const customTriggersMapping: Record<string, string> = {
            '[': ']',
            '(': ')',
            '{': '}',
            '"': '"',
            "'": "'",
            '<': '>',
            '`': '`',
            // Add more trigger mappings as needed
        };

        const openingBracketIndex = currentLine.lastIndexOf('{');
        const openingBracketPosition = openingBracketIndex !== -1 ? new vscode.Position(position.line, openingBracketIndex) : null;
        const openingBracket = '{';
        const closingBracket = '}';
        const indentation = editor.document.lineAt(position.line).text.match(/^\s*/)![0];

        const closingBracketText = autoCloseFormatting === 'newLineBefore'
            ? `\n${indentation.slice(0, -1)}${closingBracket}\n${indentation}`
            : autoCloseFormatting === 'newLineAfter'
            ? `\n${indentation}${closingBracket}`
            : closingBracket;

        const tabSize = editor.options.tabSize as number;
        const tabCharacter = editor.options.insertSpaces ? ' '.repeat(tabSize) : '\t';

        const userSnippets: Record<string, string> = {
            '{': 'console.log($1);$0',
            // Add more user-defined snippets as needed
        };

        const lintingEnabled = config.get('lintingEnabled', true);

        const selections = editor.selections.map(sel => sel.active);

        if (autoCloseEnabled) {
            editor.edit(editBuilder => {
                for (const sel of selections) {
                    const insertPos = new vscode.Position(sel.line, sel.character);
                    editBuilder.insert(insertPos, closingBracketText);

                    if (isInsideString) {
                        const charBeforeCursor = editor.document.lineAt(sel.line).text.charAt(sel.character - 1);
                        const charAfterCursor = editor.document.lineAt(sel.line).text.charAt(sel.character);

                        function isEscaped(char: string): boolean {
                            const backslashCount = currentLine.substring(0, position.character - 1).split('\\').length - 1;
                            return backslashCount % 2 !== 0;
                        }

                        if (charBeforeCursor === charAfterCursor && !isEscaped(charBeforeCursor)) {
                            editBuilder.insert(insertPos, '\\');
                        }
                    }

                    if (autoCloseOtherBrackets) {
                        const openingBrackets = ['(', '[', '{', '"', "'"];
                        const closingBrackets = [')', ']', '}', '"', "'"];

                        const getMatchingBracket = (bracket: string) => {
                            const openIndex = openingBrackets.indexOf(bracket);
                            return openIndex !== -1 ? closingBrackets[openIndex] : null;
                        };

                        const charBeforeCursor = editor.document.lineAt(sel.line).text.charAt(sel.character - 1);

                        if (openingBrackets.includes(charBeforeCursor)) {
                            const matchingBracket = getMatchingBracket(charBeforeCursor);
                            if (matchingBracket) {
                                editBuilder.insert(insertPos, matchingBracket);
                            }
                        } else {
                            editBuilder.insert(insertPos, closingBracketText);
                        }
                    }

                    if (customTriggers.includes(currentLine.charAt(position.character - 1))) {
                        const openingTrigger = currentLine.charAt(position.character - 1);
                        const snippet = userSnippets[openingTrigger];
                        if (snippet) {
                            editBuilder.insert(insertPos, snippet);
                        }
                    }

                    if (autoCloseSmart) {
                        const charBeforeCursor = editor.document.lineAt(sel.line).text.charAt(sel.character - 1);

                        if (!/\s/.test(charBeforeCursor)) {
                            editBuilder.insert(insertPos, closingBracketText);
                        }
                    }

                    if (indentation) {
                        const lineText = editor.document.lineAt(sel.line).text;
                        const leadingWhitespace = lineText.match(/^\s*/)![0];
                        editBuilder.insert(insertPos, `\n${leadingWhitespace}`);
                    }
                }

                if (openingBracketPosition) {
                    editor.selections = [new vscode.Selection(openingBracketPosition, openingBracketPosition)];
                }

                const autoCloseQuotes = config.get('autoCloseQuotes', true);
                if (autoCloseQuotes && ['"', "'", '`'].includes(currentLine.charAt(position.character - 1))) {
                    const quoteChar = currentLine.charAt(position.character - 1);
                    const isQuoteEscaped = currentLine.charAt(position.character - 2) === '\\';

                    if (!isInsideString || (quoteChar === currentLine.charAt(position.character) && !isQuoteEscaped)) {
                        const insertPos = new vscode.Position(position.line, position.character);
                        editBuilder.insert(insertPos, quoteChar);
                    }
                }
            });

            await editor.document.save();
            await vscode.commands.executeCommand('editor.action.formatDocument');
        }
    });

    let goToMatchingBracketDisposable = vscode.commands.registerCommand('extension.goToMatchingBracket', async () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const position = editor.selection.active;
            const currentChar = editor.document.getText(new vscode.Range(position, position.translate(0, 1)));

            if (openingBrackets.includes(currentChar) || closingBrackets.includes(currentChar)) {
                const matchedPosition = await findMatchingBracket(editor, position);

                if (matchedPosition) {
                    editor.selection = new vscode.Selection(matchedPosition, matchedPosition);
                    editor.revealRange(new vscode.Range(matchedPosition, matchedPosition));
                }
            }
        }
    });

    const openBrackets: { [line: number]: number[] } = {};

    vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor) {
            const editor = event.textEditor;
            const selections = editor.selections;
            const decorations: vscode.DecorationOptions[] = [];

            selections.forEach(selection => {
                const position = selection.active;
                const line = position.line;
                const character = position.character;
                const currentLine = editor.document.lineAt(line).text;

                if (['(', '[', '{'].includes(currentLine.charAt(character))) {
                    if (!openBrackets[line]) {
                        openBrackets[line] = [];
                    }
                    openBrackets[line].push(character);
                }

                if ([')', ']', '}'].includes(currentLine.charAt(character))) {
                    const matchingIndex = openBrackets[line]?.pop();
                    if (matchingIndex !== undefined) {
                        const startPos = new vscode.Position(line, matchingIndex);
                        const endPos = new vscode.Position(line, character);
                        decorations.push({
                            range: new vscode.Range(startPos, endPos),
                        });
                    }
                }
            });

            editor.setDecorations(bracketPairDecorationType, decorations);
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(braceWrapDisposable);
    context.subscriptions.push(goToMatchingBracketDisposable);

    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('typescript', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const edits: vscode.TextEdit[] = [];
            // ... Fill in the edits array with formatting edits ...
            return edits;
        }
    }));
}

export function deactivate() {
    bracketPairDecorationType.dispose();
    if (braceWrapDisposable) {
        braceWrapDisposable.dispose();
    }
}
