# CodeStyleEnhancer

<div align="center">
    <img width="500px" height="350px" alt="CodeStyleEnhancer" src="https://github.com/Coder2Mo/CodeStyleEnhancer/blob/main/images/icon.png">
</div>

<br>
<br>

This Extension serves as the implementation of a Visual Studio Code extension that provides enhanced auto-closing bracket functionality.
The main purpose of the extension is to automatically insert closing brackets, such as parentheses, square brackets, and curly braces, as well as various types of quotes and code blocks in specific scenarios.
The extension also offers features like matching bracket highlighting, auto-closing inside comments, and configurable behaviors for different languages.</p><p>
Here's what the code does:</p><ol><li><p><strong>Auto-Closing Brackets and Quotes:</strong> The extension automatically inserts closing brackets when an opening bracket is typed.
It also handles auto-closing quotes like double quotes, single quotes, and backticks.</p></li>

``` typescript
if (autoCloseQuotes && ['"', "'", '`'].includes(currentLine.charAt(position.character - 1))) {
    const quoteChar = currentLine.charAt(position.character - 1);
    const isQuoteEscaped = currentLine.charAt(position.character - 2) === '\\';

    if (!isInsideString || (quoteChar === currentLine.charAt(position.character) && !isQuoteEscaped)) {
        const insertPos = new vscode.Position(position.line, position.character);
        editBuilder.insert(insertPos, quoteChar);
    }
}
// - CoderMo
```

<li><p><strong>Matching Bracket Highlighting:</strong> The extension highlights the matching opening bracket when the cursor is near a closing bracket.</p></li>

``` typescript
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

// - CoderMo
```

<li><p><strong>Auto-Closing Inside Comments:</strong> The extension optionally closes brackets and quotes inside comments, depending on user configuration.</p></li>

``` typescript
const autoCloseInsideComments = config.get('autoCloseInsideComments', false);

const position = editor.selection.active;
const currentLine = editor.document.lineAt(position.line).text;
const isInsideComment = currentLine.trim().startsWith('//');

if ((!/\}$/.test(currentLine) || autoCloseInsideComments) &&
    !isInsideString &&
    (!isInsideComment || autoCloseInsideComments)
) {
    // ... Rest of the code ...
}

// - CoderMo
```

<li><p><strong>Auto-Closing in Markdown Code Blocks:</strong> The extension can automatically insert closing markers for code blocks in Markdown files.</p></li>

``` typescript
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

// - CoderMo
```

<li><p><strong>Customizable Auto-Close Rules:</strong> You can define auto-close behavior based on language rules. For example, you can configure whether a closing bracket is placed on the same line or a new line after an opening bracket.</p></li>

``` typescript
const languageRules: Record<string, string> = {
    'javascript': 'sameLine',
    'typescript': 'newLineAfter',
    // Add more languages and rules as needed
};

const languageId = editor.document.languageId;
const languageSpecificRule = vscode.workspace.getConfiguration('autoCloseBracketsEnhanced').get(`languageRules.${languageId}`, languageRules[languageId]);
const autoCloseFormatting = languageSpecificRule || 'sameLine';

// - CoderMo
```

<li><p><strong>Custom Triggers:</strong> You can define custom triggers that, when typed, insert specific code snippets.</p></li>

``` typescript
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

if (customTriggers.includes(currentLine.charAt(position.character - 1))) {
    const openingTrigger = currentLine.charAt(position.character - 1);
    const snippet = userSnippets[openingTrigger];
    if (snippet) {
        editBuilder.insert(insertPos, snippet);
    }
}

// - CoderMo
```

<li><p><strong>Linting Integration:</strong> The extension integrates with linting tools (configurable through the <code>lintingTool</code> setting) and can process linting results. However, the specific linting functionality (e.g., handling linting results) appears to be a work in progress and may need further development to integrate seamlessly.</p></li>

``` typescript
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { LintingResult, parseLintingResults } from './lintingResult';

// - CoderMo
```
<br>

``` typescript
async function runLinting(document: vscode.TextDocument): Promise<LintingResult[]> {
    // ...
    const lintingTool = vscode.workspace.getConfiguration().get('autoCloseBracketsEnhanced.lintingTool', 'eslint');
    const lintingProcess = spawn(lintingTool, [document.uri.fsPath, '--format=json'], { shell: true });
    
    // ...
    lintingProcess.stdout.on('data', (data: Buffer) => {
        lintingOutput += data.toString();
    });

    // ...
    lintingProcess.on('close', async code => {
        if (code === 0) {
            const rawLintingResults: any[] = JSON.parse(lintingOutput);
            const lintingResults = await parseLintingResults(rawLintingResults);
            resolve(lintingResults);
        } else {
            reject(new Error('Linting failed'));
        }
    });
}

// - CoderMo
```
<br>

``` typescript
async function findMatchingClosingBracket(
    editor: vscode.TextEditor,
    position: vscode.Position,
    currentChar: string,
    openingChar: string,
    closingChar: string
): Promise<vscode.Position | null> {
    // ...
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
    // ...
}

// - CoderMo
```

<li><p><strong>Bracket Pair Decoration:</strong> The extension provides bracket pair decoration to visually highlight matched opening and closing brackets.</p></li>

``` typescript
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

// - CoderMo
```

  <li><p><strong><code>braceWrap</code> Command:</strong> You can use the <code>braceWrap</code> command to wrap selected code with curly braces.</p></li>

  ``` typescript
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

// - CoderMo
```

  <li><p><strong><code>goToMatchingBracket</code> Command:</strong> The extension provides the <code>goToMatchingBracket</code> command to navigate between matching opening and closing brackets.</p></li>

   ``` typescript
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

// - CoderMo
```
  
  <li><p><strong>Formatting Provider:</strong> The extension registers a document formatting provider for TypeScript files.</p></li></ol>

   ``` typescript
context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('typescript', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const edits: vscode.TextEdit[] = [];
        // ... Fill in the edits array with formatting edits ...
        return edits;
    }
}));

// - CoderMo
```
