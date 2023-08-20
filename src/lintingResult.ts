import * as vscode from 'vscode';

export interface LintingResult {
    filePath: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    severity: string;
    source: string;
    fixable: boolean;
    suggestions: string[];

    // Additional properties (example values)
    codeFrame?: string;
    documentationUrl?: string;
    filePathRelativeToWorkspace?: string;
    codeSnippet?: string;
}

export async function parseLintingResults(rawResults: any[]): Promise<LintingResult[]> {
    const lintingResults: LintingResult[] = [];

    for (const rawResult of rawResults) {
        const lintingResult: LintingResult = {
            filePath: rawResult.filePath,
            line: rawResult.line,
            column: rawResult.column,
            message: rawResult.message,
            ruleId: rawResult.ruleId,
            severity: rawResult.severity,
            source: rawResult.source,
            fixable: rawResult.fixable,
            suggestions: rawResult.suggestions,

            // Additional properties (example values)
            codeFrame: rawResult.codeFrame,
            documentationUrl: rawResult.documentationUrl,
            filePathRelativeToWorkspace: rawResult.filePathRelativeToWorkspace,
            codeSnippet: rawResult.codeSnippet,
        };

        lintingResults.push(lintingResult);
    }

    return lintingResults;
}
