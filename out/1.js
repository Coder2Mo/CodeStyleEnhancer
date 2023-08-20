"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const lintingResult_1 = require("./lintingResult");
let bracketPairDecorationType;
let openingBrackets;
let closingBrackets;
let config;
function findMatchingOpeningBracket(editor, position, currentChar, openingChar, closingChar) {
    const currentLine = editor.document.lineAt(position.line).text;
    const lineCount = editor.document.lineCount;
    let openBracketCount = 0;
    for (let lineIndex = position.line; lineIndex >= 0; lineIndex--) {
        const lineText = editor.document.lineAt(lineIndex).text;
        for (let charIndex = lineText.length - 1; charIndex >= 0; charIndex--) {
            const char = lineText.charAt(charIndex);
            if (char === openingChar) {
                openBracketCount++;
            }
            else if (char === closingChar) {
                if (openBracketCount === 0) {
                    return new vscode.Position(lineIndex, charIndex);
                }
                else {
                    openBracketCount--;
                }
            }
        }
    }
    return null;
}
function runLinting(document) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const lintingTool = vscode.workspace.getConfiguration().get('autoCloseBracketsEnhanced.lintingTool', 'eslint');
            const lintingProcess = (0, child_process_1.spawn)(lintingTool, [document.uri.fsPath, '--format=json'], { shell: true });
            let lintingOutput = '';
            lintingProcess.stdout.on('data', (data) => {
                lintingOutput += data.toString();
            });
            lintingProcess.on('close', (code) => __awaiter(this, void 0, void 0, function* () {
                if (code === 0) {
                    const rawLintingResults = JSON.parse(lintingOutput);
                    const lintingResults = yield (0, lintingResult_1.parseLintingResults)(rawLintingResults);
                    resolve(lintingResults);
                }
                else {
                    reject(new Error('Linting failed'));
                }
            }));
        });
    });
}
function findMatchingClosingBracket(editor, position, currentChar, openingChar, closingChar) {
    return __awaiter(this, void 0, void 0, function* () {
        if (editor) {
            const currentPosition = editor.selection.active;
            const currentLine = editor.document.lineAt(currentPosition.line).text;
            const lintingEnabled = vscode.workspace.getConfiguration().get('autoCloseBracketsEnhanced.lintingEnabled', true);
            if (lintingEnabled) {
                try {
                    const lintingResults = yield runLinting(editor.document);
                    for (const lintingResult of lintingResults) {
                        console.log('Linting Result:', lintingResult);
                        // You can process the linting results here and use the information as needed
                    }
                }
                catch (error) {
                    console.error('Linting failed:', error.message);
                }
            }
            return null;
        }
        return null;
    });
}
function findMatchingBracket(editor, position) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentChar = editor.document.getText(new vscode.Range(position, position.translate(0, 1)));
        const openingIndex = openingBrackets.indexOf(currentChar);
        const closingIndex = closingBrackets.indexOf(currentChar);
        if (openingIndex !== -1) {
            return yield findMatchingClosingBracket(editor, position, currentChar, openingBrackets[openingIndex], closingBrackets[openingIndex]);
        }
        else if (closingIndex !== -1) {
            return yield findMatchingOpeningBracket(editor, position, currentChar, openingBrackets[closingIndex], closingBrackets[closingIndex]);
        }
        return null;
    });
}
let braceWrapDisposable;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Enhanced Auto Close Brackets extension is now active.');
        config = vscode.workspace.getConfiguration('autoCloseBracketsEnhanced');
        openingBrackets = ['(', '[', '{'];
        closingBrackets = [')', ']', '}'];
        bracketPairDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(100, 100, 255, 0.3)',
        });
        braceWrapDisposable = vscode.commands.registerCommand('extension.braceWrap', () => __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selections = editor.selections;
                const closingBracket = '}';
                editor.edit(editBuilder => {
                    selections.forEach(selection => {
                        const startPos = selection.start;
                        const endPos = selection.end;
                        const indentation = editor.document.lineAt(startPos.line).text.match(/^\s*/)[0];
                        editBuilder.insert(startPos, '{');
                        editBuilder.insert(endPos, `${indentation}${closingBracket}`);
                    });
                });
            }
        }));
        const matchingBracketDecoration = vscode.window.createTextEditorDecorationType({
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'yellow', // You can choose a suitable color
        });
        let disposable = vscode.commands.registerCommand('extension.autoCloseBracketsEnhanced', () => __awaiter(this, void 0, void 0, function* () {
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
                (!isInsideComment || autoCloseInsideComments)) {
                const openingBracketPosition = findMatchingOpeningBracket(editor, position, currentLine, '{', '}');
                if (openingBracketPosition) {
                    editor.setDecorations(matchingBracketDecoration, [new vscode.Range(openingBracketPosition, openingBracketPosition.translate(0, 1))]);
                }
                else {
                    editor.setDecorations(matchingBracketDecoration, []);
                }
            }
            const autoCloseInMarkdownCodeBlocks = config.get('autoCloseBracketsEnhanced.autoCloseInMarkdownCodeBlocks', true);
            if (!/\}$/.test(currentLine) && !isInsideString && !isInsideComment) {
                const languageId = editor.document.languageId;
                function isInsideMarkdownCodeBlock(document, position) {
                    const lineText = document.lineAt(position.line).text;
                    return lineText.trim() === '```';
                }
                function determineClosingBracketForMarkdown(document, position) {
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
            const languageRules = {
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
            const customTriggersMapping = {
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
            const indentation = editor.document.lineAt(position.line).text.match(/^\s*/)[0];
            const closingBracketText = autoCloseFormatting === 'newLineBefore'
                ? `\n${indentation.slice(0, -1)}${closingBracket}\n${indentation}`
                : autoCloseFormatting === 'newLineAfter'
                    ? `\n${indentation}${closingBracket}`
                    : closingBracket;
            const tabSize = editor.options.tabSize;
            const tabCharacter = editor.options.insertSpaces ? ' '.repeat(tabSize) : '\t';
            const userSnippets = {
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
                            function isEscaped(char) {
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
                            const getMatchingBracket = (bracket) => {
                                const openIndex = openingBrackets.indexOf(bracket);
                                return openIndex !== -1 ? closingBrackets[openIndex] : null;
                            };
                            const charBeforeCursor = editor.document.lineAt(sel.line).text.charAt(sel.character - 1);
                            if (openingBrackets.includes(charBeforeCursor)) {
                                const matchingBracket = getMatchingBracket(charBeforeCursor);
                                if (matchingBracket) {
                                    editBuilder.insert(insertPos, matchingBracket);
                                }
                            }
                            else {
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
                            const leadingWhitespace = lineText.match(/^\s*/)[0];
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
                yield editor.document.save();
                yield vscode.commands.executeCommand('editor.action.formatDocument');
            }
        }));
        let goToMatchingBracketDisposable = vscode.commands.registerCommand('extension.goToMatchingBracket', () => __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const position = editor.selection.active;
                const currentChar = editor.document.getText(new vscode.Range(position, position.translate(0, 1)));
                if (openingBrackets.includes(currentChar) || closingBrackets.includes(currentChar)) {
                    const matchedPosition = yield findMatchingBracket(editor, position);
                    if (matchedPosition) {
                        editor.selection = new vscode.Selection(matchedPosition, matchedPosition);
                        editor.revealRange(new vscode.Range(matchedPosition, matchedPosition));
                    }
                }
            }
        }));
        const openBrackets = {};
        vscode.window.onDidChangeTextEditorSelection(event => {
            if (event.textEditor) {
                const editor = event.textEditor;
                const selections = editor.selections;
                const decorations = [];
                selections.forEach(selection => {
                    var _a;
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
                        const matchingIndex = (_a = openBrackets[line]) === null || _a === void 0 ? void 0 : _a.pop();
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
            provideDocumentFormattingEdits(document) {
                const edits = [];
                // ... Fill in the edits array with formatting edits ...
                return edits;
            }
        }));
    });
}
exports.activate = activate;
function deactivate() {
    bracketPairDecorationType.dispose();
    if (braceWrapDisposable) {
        braceWrapDisposable.dispose();
    }
}
exports.deactivate = deactivate;
