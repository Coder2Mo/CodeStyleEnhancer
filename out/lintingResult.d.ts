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
    codeFrame?: string;
    documentationUrl?: string;
    filePathRelativeToWorkspace?: string;
    codeSnippet?: string;
}
export declare function parseLintingResults(rawResults: any[]): Promise<LintingResult[]>;
